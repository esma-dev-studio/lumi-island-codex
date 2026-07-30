"""Generate Lumi Island's original skinned GLB character assets.

The generator intentionally uses only Python's standard library. Geometry is
authored as asymmetric lofts, sculpted surfaces and curved sweeps instead of
runtime Babylon.js primitives. Re-run after changing the design functions:

    python scripts/generate_character_glbs.py
"""

from __future__ import annotations

import json
import math
import struct
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable, Sequence


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "characters" / "models"


Vec3 = tuple[float, float, float]


@dataclass
class Surface:
    positions: list[Vec3] = field(default_factory=list)
    faces: list[tuple[int, int, int]] = field(default_factory=list)
    joints: list[int] = field(default_factory=list)

    def add(self, position: Vec3, joint: int) -> int:
        self.positions.append(position)
        self.joints.append(joint)
        return len(self.positions) - 1


class CharacterGeometry:
    def __init__(self, material_count: int) -> None:
        self.surfaces = [Surface() for _ in range(material_count)]

    def sculpted_blob(
        self,
        material: int,
        joint: int,
        center: Vec3,
        radii: Vec3,
        deform: Callable[[float, float, Vec3], Vec3] | None = None,
        segments: int = 28,
        rings: int = 16,
    ) -> None:
        surface = self.surfaces[material]
        start = len(surface.positions)
        for ring in range(rings + 1):
            latitude = -math.pi / 2 + math.pi * ring / rings
            c = math.cos(latitude)
            s = math.sin(latitude)
            for segment in range(segments):
                longitude = math.tau * segment / segments
                x = center[0] + radii[0] * c * math.cos(longitude)
                y = center[1] + radii[1] * s
                z = center[2] + radii[2] * c * math.sin(longitude)
                point = (x, y, z)
                if deform:
                    point = deform(latitude, longitude, point)
                surface.add(point, joint)
        for ring in range(rings):
            for segment in range(segments):
                nxt = (segment + 1) % segments
                a = start + ring * segments + segment
                b = start + ring * segments + nxt
                c = start + (ring + 1) * segments + segment
                d = start + (ring + 1) * segments + nxt
                surface.faces.extend(((a, c, b), (b, c, d)))

    def loft(
        self,
        material: int,
        joint: int,
        rings: Sequence[tuple[float, float, float, float]],
        center_x: float = 0,
        center_z: float = 0,
        segments: int = 28,
        phase: float = 0,
        squash: Callable[[float], float] | None = None,
    ) -> None:
        """Add a ring loft. Each ring is (y, radius_x, radius_z, z_offset)."""
        surface = self.surfaces[material]
        start = len(surface.positions)
        for ring_index, (y, radius_x, radius_z, z_offset) in enumerate(rings):
            progress = ring_index / max(1, len(rings) - 1)
            shape = squash(progress) if squash else 1
            for segment in range(segments):
                angle = math.tau * segment / segments + phase
                # A mild second harmonic keeps the silhouette hand-sculpted.
                irregular = 1 + 0.025 * math.cos(angle * 2 + progress)
                surface.add(
                    (
                        center_x + radius_x * irregular * math.cos(angle),
                        y,
                        center_z + z_offset + radius_z * shape * math.sin(angle),
                    ),
                    joint,
                )
        for ring_index in range(len(rings) - 1):
            for segment in range(segments):
                nxt = (segment + 1) % segments
                a = start + ring_index * segments + segment
                b = start + ring_index * segments + nxt
                c = start + (ring_index + 1) * segments + segment
                d = start + (ring_index + 1) * segments + nxt
                surface.faces.extend(((a, c, b), (b, c, d)))
        bottom = surface.add((center_x, rings[0][0], center_z + rings[0][3]), joint)
        top = surface.add((center_x, rings[-1][0], center_z + rings[-1][3]), joint)
        for segment in range(segments):
            nxt = (segment + 1) % segments
            surface.faces.append((bottom, start + nxt, start + segment))
            last = start + (len(rings) - 1) * segments
            surface.faces.append((top, last + segment, last + nxt))

    def curved_sweep(
        self,
        material: int,
        joint: int,
        points: Sequence[Vec3],
        radii: Sequence[tuple[float, float]],
        sides: int = 16,
    ) -> None:
        surface = self.surfaces[material]
        start = len(surface.positions)
        for point_index, point in enumerate(points):
            before = points[max(0, point_index - 1)]
            after = points[min(len(points) - 1, point_index + 1)]
            tangent = normalize(
                (after[0] - before[0], after[1] - before[1], after[2] - before[2])
            )
            reference = (0.0, 0.0, 1.0) if abs(tangent[2]) < 0.85 else (1.0, 0.0, 0.0)
            side = normalize(cross(tangent, reference))
            up = normalize(cross(side, tangent))
            radius_x, radius_y = radii[point_index]
            for side_index in range(sides):
                angle = math.tau * side_index / sides
                offset = add(
                    scale(side, math.cos(angle) * radius_x),
                    scale(up, math.sin(angle) * radius_y),
                )
                surface.add(add(point, offset), joint)
        for point_index in range(len(points) - 1):
            for side_index in range(sides):
                nxt = (side_index + 1) % sides
                a = start + point_index * sides + side_index
                b = start + point_index * sides + nxt
                c = start + (point_index + 1) * sides + side_index
                d = start + (point_index + 1) * sides + nxt
                surface.faces.extend(((a, c, b), (b, c, d)))
        for endpoint, reverse in ((0, True), (len(points) - 1, False)):
            center = surface.add(points[endpoint], joint)
            ring = start + endpoint * sides
            for side_index in range(sides):
                nxt = (side_index + 1) % sides
                face = (center, ring + nxt, ring + side_index)
                surface.faces.append(face if reverse else tuple(reversed(face)))

    def tapered_limb(
        self,
        material: int,
        joint: int,
        start: Vec3,
        end: Vec3,
        radius_start: tuple[float, float],
        radius_end: tuple[float, float],
        bend: Vec3 = (0, 0, 0),
        rings: int = 7,
    ) -> None:
        points: list[Vec3] = []
        radii: list[tuple[float, float]] = []
        for index in range(rings):
            t = index / (rings - 1)
            arc = 4 * t * (1 - t)
            points.append(
                (
                    start[0] + (end[0] - start[0]) * t + bend[0] * arc,
                    start[1] + (end[1] - start[1]) * t + bend[1] * arc,
                    start[2] + (end[2] - start[2]) * t + bend[2] * arc,
                )
            )
            radii.append(
                (
                    radius_start[0] + (radius_end[0] - radius_start[0]) * t,
                    radius_start[1] + (radius_end[1] - radius_start[1]) * t,
                )
            )
        self.curved_sweep(material, joint, points, radii)


def add(a: Vec3, b: Vec3) -> Vec3:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def scale(a: Vec3, value: float) -> Vec3:
    return (a[0] * value, a[1] * value, a[2] * value)


def cross(a: Vec3, b: Vec3) -> Vec3:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def normalize(value: Vec3) -> Vec3:
    length = math.sqrt(value[0] ** 2 + value[1] ** 2 + value[2] ** 2)
    if length < 1e-8:
        return (0, 1, 0)
    return (value[0] / length, value[1] / length, value[2] / length)


def vertex_normals(surface: Surface) -> list[Vec3]:
    normals = [(0.0, 0.0, 0.0) for _ in surface.positions]
    for face in surface.faces:
        a, b, c = (surface.positions[index] for index in face)
        normal = cross(
            (b[0] - a[0], b[1] - a[1], b[2] - a[2]),
            (c[0] - a[0], c[1] - a[1], c[2] - a[2]),
        )
        for index in face:
            normals[index] = add(normals[index], normal)
    return [normalize(normal) for normal in normals]


def qx(angle: float) -> tuple[float, float, float, float]:
    return (math.sin(angle / 2), 0, 0, math.cos(angle / 2))


def qy(angle: float) -> tuple[float, float, float, float]:
    return (0, math.sin(angle / 2), 0, math.cos(angle / 2))


def qz(angle: float) -> tuple[float, float, float, float]:
    return (0, 0, math.sin(angle / 2), math.cos(angle / 2))


BONE_NAMES = (
    "Root",
    "Hips",
    "Spine",
    "Head",
    "UpperArm.L",
    "Forearm.L",
    "UpperArm.R",
    "Forearm.R",
    "Thigh.L",
    "Shin.L",
    "Thigh.R",
    "Shin.R",
)

BONE_PARENTS = (-1, 0, 1, 2, 2, 4, 2, 6, 1, 8, 1, 10)
BONE_LOCAL_POSITIONS: tuple[Vec3, ...] = (
    (0, 0, 0),
    (0, 0.95, 0),
    (0, 0.75, 0),
    (0, 0.8, 0),
    (-0.57, 0.48, 0),
    (0, -0.55, 0),
    (0.57, 0.48, 0),
    (0, -0.55, 0),
    (-0.27, -0.05, 0),
    (0, -0.68, 0),
    (0.27, -0.05, 0),
    (0, -0.68, 0),
)


def bone_world_positions() -> list[Vec3]:
    result: list[Vec3] = []
    for index, local in enumerate(BONE_LOCAL_POSITIONS):
        parent = BONE_PARENTS[index]
        result.append(local if parent < 0 else add(result[parent], local))
    return result


def head_deform(latitude: float, longitude: float, point: Vec3) -> Vec3:
    lower = max(0.0, -math.sin(latitude))
    cheek = max(0.0, math.cos(latitude)) * (0.05 + 0.04 * math.cos(longitude * 2))
    front = max(0.0, math.sin(longitude))
    return (
        point[0] * (1 + cheek),
        point[1] - 0.07 * lower,
        point[2] + 0.05 * front * (1 - lower),
    )


def add_human(geo: CharacterGeometry) -> None:
    # Layered torso and tunic.
    geo.loft(
        1,
        2,
        (
            (1.48, 0.39, 0.29, -0.01),
            (1.64, 0.44, 0.31, 0),
            (1.9, 0.48, 0.32, 0),
            (2.12, 0.40, 0.28, 0),
        ),
    )
    geo.loft(
        1,
        2,
        (
            (1.46, 0.49, 0.34, -0.01),
            (1.58, 0.51, 0.35, 0),
            (1.75, 0.47, 0.34, 0.01),
            (1.94, 0.43, 0.31, 0.01),
        ),
        phase=0.08,
    )
    # Head with custom cheeks and jaw.
    geo.sculpted_blob(0, 3, (0, 2.67, 0), (0.69, 0.66, 0.61), head_deform)
    # Nose and ears.
    geo.sculpted_blob(0, 3, (0, 2.59, 0.58), (0.1, 0.09, 0.12), segments=18, rings=10)
    geo.sculpted_blob(0, 3, (-0.68, 2.68, 0), (0.13, 0.21, 0.1), segments=18, rings=10)
    geo.sculpted_blob(0, 3, (0.68, 2.68, 0), (0.13, 0.21, 0.1), segments=18, rings=10)
    # Sculpted hair mass and three directional tufts.
    geo.sculpted_blob(2, 3, (0, 3.13, -0.05), (0.72, 0.32, 0.58), segments=30, rings=14)
    geo.curved_sweep(
        2,
        3,
        ((-0.28, 3.25, 0.1), (-0.15, 3.52, 0.08), (0.08, 3.41, 0.22)),
        ((0.22, 0.18), (0.2, 0.15), (0.05, 0.05)),
    )
    geo.curved_sweep(
        2,
        3,
        ((0.06, 3.25, 0.02), (0.27, 3.48, 0.02), (0.43, 3.31, 0.2)),
        ((0.2, 0.17), (0.18, 0.14), (0.05, 0.04)),
    )
    # Arms, rolled sleeves, hands.
    for side, x, upper, forearm in ((-1, -0.58, 4, 5), (1, 0.58, 6, 7)):
        geo.tapered_limb(3, upper, (x, 2.16, 0), (x + 0.02 * side, 1.66, 0.02), (0.2, 0.19), (0.17, 0.16))
        geo.tapered_limb(0, forearm, (x + 0.02 * side, 1.66, 0.02), (x + 0.02 * side, 1.2, 0.05), (0.16, 0.15), (0.12, 0.12), (0, 0, 0.035))
        geo.sculpted_blob(0, forearm, (x + 0.02 * side, 1.12, 0.08), (0.14, 0.19, 0.13), segments=18, rings=10)
    # Shorts, legs, socks and asymmetrical boots.
    geo.loft(2, 1, ((1.12, 0.47, 0.33, 0), (1.48, 0.48, 0.34, 0)), phase=0.08)
    for side, x, thigh, shin in ((-1, -0.27, 8, 9), (1, 0.27, 10, 11)):
        geo.tapered_limb(0, thigh, (x, 1.1, 0), (x, 0.58, 0), (0.18, 0.17), (0.15, 0.14))
        geo.tapered_limb(3, shin, (x, 0.58, 0), (x, 0.15, 0.05), (0.18, 0.17), (0.2, 0.18))
        geo.sculpted_blob(
            2,
            shin,
            (x, 0.16, 0.16),
            (0.25, 0.2, 0.36 + (0.02 if side > 0 else 0)),
            segments=22,
            rings=12,
        )
    # Belt and separate pouch with thickness.
    geo.loft(3, 2, ((1.47, 0.5, 0.36, 0), (1.57, 0.51, 0.36, 0)), segments=30)
    geo.sculpted_blob(3, 2, (-0.49, 1.43, 0.29), (0.24, 0.27, 0.13), segments=20, rings=12)


def add_goat(geo: CharacterGeometry) -> None:
    # Fur body beneath a thick woodworking shirt and apron.
    geo.loft(0, 2, ((1.25, 0.45, 0.35, 0), (1.7, 0.57, 0.42, 0), (2.17, 0.46, 0.34, 0)))
    geo.loft(1, 2, ((1.34, 0.58, 0.39, 0.02), (1.72, 0.62, 0.42, 0.02), (2.08, 0.5, 0.36, 0.01)))
    geo.loft(3, 2, ((1.08, 0.63, 0.43, 0.02), (1.55, 0.65, 0.44, 0.04), (1.98, 0.53, 0.36, 0.04)))
    # Long goat head and muzzle, not a human sphere.
    def goat_head_deform(latitude: float, longitude: float, point: Vec3) -> Vec3:
        front = max(0.0, math.sin(longitude))
        taper = 0.08 * max(0.0, -math.sin(latitude))
        return (point[0] * (1 - taper), point[1], point[2] + 0.12 * front)

    geo.sculpted_blob(0, 3, (0, 2.73, 0.02), (0.62, 0.69, 0.56), goat_head_deform)
    geo.sculpted_blob(0, 3, (0, 2.55, 0.59), (0.4, 0.28, 0.45), segments=26, rings=14)
    geo.sculpted_blob(2, 3, (0, 2.49, 0.97), (0.13, 0.12, 0.13), segments=18, rings=10)
    # Floppy tapered ears.
    for side in (-1, 1):
        x = 0.48 * side
        geo.curved_sweep(
            0,
            3,
            ((x, 2.94, 0), (0.77 * side, 2.73, 0.01), (0.9 * side, 2.45, 0.08)),
            ((0.2, 0.09), (0.24, 0.075), (0.08, 0.04)),
            sides=18,
        )
        # Swept horns with a backward curl.
        geo.curved_sweep(
            2,
            3,
            ((0.28 * side, 3.25, -0.04), (0.42 * side, 3.47, -0.12), (0.52 * side, 3.48, -0.34), (0.49 * side, 3.29, -0.48)),
            ((0.12, 0.11), (0.11, 0.1), (0.085, 0.075), (0.025, 0.025)),
            sides=16,
        )
    # Beard tuft and tail.
    geo.curved_sweep(
        0,
        3,
        ((0, 2.36, 0.56), (0, 2.12, 0.58), (0.04, 1.98, 0.51)),
        ((0.2, 0.13), (0.16, 0.1), (0.04, 0.03)),
    )
    geo.curved_sweep(
        0,
        1,
        ((0, 1.38, -0.38), (0, 1.45, -0.68), (0.06, 1.67, -0.78)),
        ((0.2, 0.17), (0.18, 0.14), (0.04, 0.035)),
    )
    # Sleeves, furry forearms and hoof hands.
    for side, x, upper, forearm in ((-1, -0.62, 4, 5), (1, 0.62, 6, 7)):
        geo.tapered_limb(1, upper, (x, 2.13, 0), (x, 1.63, 0.03), (0.23, 0.21), (0.19, 0.18))
        geo.tapered_limb(0, forearm, (x, 1.63, 0.03), (x, 1.22, 0.16), (0.2, 0.18), (0.15, 0.14), (0, 0, 0.06))
        geo.sculpted_blob(2, forearm, (x, 1.14, 0.2), (0.17, 0.21, 0.17), segments=18, rings=10)
    # Legs and split hoof silhouette.
    for side, x, thigh, shin in ((-1, -0.29, 8, 9), (1, 0.29, 10, 11)):
        geo.tapered_limb(0, thigh, (x, 1.1, 0), (x, 0.54, 0), (0.23, 0.21), (0.18, 0.17))
        geo.tapered_limb(0, shin, (x, 0.54, 0), (x, 0.17, 0.05), (0.19, 0.18), (0.17, 0.16))
        geo.sculpted_blob(2, shin, (x - 0.07, 0.14, 0.18), (0.17, 0.16, 0.31), segments=18, rings=10)
        geo.sculpted_blob(2, shin, (x + 0.07, 0.14, 0.18), (0.17, 0.16, 0.31), segments=18, rings=10)
    # Apron pocket and tool silhouettes.
    geo.sculpted_blob(3, 2, (0, 1.38, 0.4), (0.38, 0.25, 0.1), segments=22, rings=12)
    for x in (-0.18, 0.02, 0.2):
        geo.curved_sweep(
            2,
            2,
            ((x, 1.48, 0.43), (x + 0.02, 1.77, 0.45)),
            ((0.045, 0.04), (0.04, 0.035)),
            sides=10,
        )


def add_otter(geo: CharacterGeometry) -> None:
    geo.loft(0, 2, ((1.2, 0.41, 0.31, 0), (1.73, 0.5, 0.38, 0), (2.12, 0.4, 0.3, 0)))
    geo.loft(1, 2, ((1.34, 0.5, 0.36, 0), (1.78, 0.55, 0.4, 0), (2.05, 0.43, 0.32, 0)))
    geo.sculpted_blob(0, 3, (0, 2.67, 0), (0.61, 0.61, 0.54), head_deform)
    geo.sculpted_blob(0, 3, (0, 2.53, 0.56), (0.42, 0.25, 0.36), segments=26, rings=14)
    geo.sculpted_blob(2, 3, (0, 2.58, 0.88), (0.12, 0.1, 0.11), segments=18, rings=10)
    for side in (-1, 1):
        geo.sculpted_blob(0, 3, (0.48 * side, 3.03, 0), (0.18, 0.18, 0.12), segments=18, rings=10)
    geo.curved_sweep(
        0,
        1,
        ((0, 1.32, -0.32), (0.16, 1.0, -0.73), (0.26, 0.57, -0.92), (0.32, 0.25, -0.75)),
        ((0.24, 0.2), (0.22, 0.17), (0.15, 0.11), (0.04, 0.03)),
    )
    for side, x, upper, forearm in ((-1, -0.55, 4, 5), (1, 0.55, 6, 7)):
        geo.tapered_limb(1, upper, (x, 2.1, 0), (x, 1.58, 0.05), (0.2, 0.18), (0.16, 0.15))
        geo.tapered_limb(0, forearm, (x, 1.58, 0.05), (x, 1.15, 0.12), (0.17, 0.16), (0.13, 0.12))
        geo.sculpted_blob(2, forearm, (x, 1.08, 0.16), (0.14, 0.18, 0.14), segments=18, rings=10)
    for x, thigh, shin in ((-0.26, 8, 9), (0.26, 10, 11)):
        geo.tapered_limb(0, thigh, (x, 1.1, 0), (x, 0.55, 0), (0.19, 0.18), (0.16, 0.15))
        geo.tapered_limb(2, shin, (x, 0.55, 0), (x, 0.15, 0.08), (0.18, 0.17), (0.2, 0.17))
        geo.sculpted_blob(2, shin, (x, 0.14, 0.2), (0.22, 0.17, 0.34), segments=20, rings=10)
    # Scarf with a readable asymmetric tail.
    geo.loft(3, 2, ((2.0, 0.46, 0.33, 0), (2.11, 0.47, 0.34, 0)), segments=28)
    geo.curved_sweep(
        3,
        2,
        ((0.28, 2.03, -0.15), (0.46, 1.79, -0.2), (0.52, 1.52, -0.12)),
        ((0.13, 0.055), (0.12, 0.05), (0.04, 0.02)),
        sides=14,
    )


def add_owl(geo: CharacterGeometry) -> None:
    geo.loft(1, 2, ((1.0, 0.5, 0.34, 0), (1.62, 0.62, 0.44, 0), (2.13, 0.44, 0.33, 0)))
    geo.sculpted_blob(0, 3, (0, 2.68, 0), (0.72, 0.65, 0.54), head_deform)
    # Brow disks, beak and ear-feather tufts.
    geo.sculpted_blob(3, 3, (-0.27, 2.72, 0.48), (0.32, 0.3, 0.11), segments=22, rings=12)
    geo.sculpted_blob(3, 3, (0.27, 2.72, 0.48), (0.32, 0.3, 0.11), segments=22, rings=12)
    geo.curved_sweep(
        2,
        3,
        ((0, 2.62, 0.59), (0, 2.48, 0.8), (0, 2.4, 0.58)),
        ((0.17, 0.12), (0.1, 0.07), (0.025, 0.02)),
        sides=16,
    )
    for side in (-1, 1):
        geo.curved_sweep(
            0,
            3,
            ((0.42 * side, 3.08, 0), (0.58 * side, 3.37, -0.02), (0.45 * side, 3.24, 0.2)),
            ((0.19, 0.11), (0.13, 0.07), (0.035, 0.025)),
            sides=16,
        )
    # Wing-shaped arms with layered tips.
    for side, x, upper, forearm in ((-1, -0.57, 4, 5), (1, 0.57, 6, 7)):
        geo.tapered_limb(0, upper, (x, 2.12, 0), (0.77 * side, 1.62, 0), (0.28, 0.12), (0.22, 0.09), (0.05 * side, 0, 0.04))
        geo.tapered_limb(0, forearm, (0.77 * side, 1.62, 0), (0.65 * side, 1.15, 0.16), (0.23, 0.1), (0.11, 0.05), (-0.05 * side, 0, 0.08))
        for feather in range(3):
            geo.curved_sweep(
                3,
                forearm,
                ((0.64 * side, 1.42 - feather * 0.1, 0.08), ((0.8 + feather * 0.05) * side, 1.13 - feather * 0.11, 0.16)),
                ((0.07, 0.035), (0.02, 0.012)),
                sides=10,
            )
    for x, thigh, shin in ((-0.25, 8, 9), (0.25, 10, 11)):
        geo.tapered_limb(0, thigh, (x, 1.05, 0), (x, 0.49, 0), (0.18, 0.17), (0.12, 0.11))
        geo.tapered_limb(2, shin, (x, 0.49, 0), (x, 0.13, 0.1), (0.13, 0.12), (0.11, 0.1))
        for toe in (-0.09, 0, 0.09):
            geo.curved_sweep(
                2,
                shin,
                ((x, 0.13, 0.1), (x + toe, 0.08, 0.38)),
                ((0.055, 0.04), (0.025, 0.018)),
                sides=9,
            )
    # Feathered lower hem.
    for index in range(9):
        angle = math.tau * index / 9
        start = (0.39 * math.cos(angle), 1.25, 0.28 * math.sin(angle))
        end = (0.48 * math.cos(angle), 0.94, 0.36 * math.sin(angle))
        geo.curved_sweep(3, 1, (start, end), ((0.12, 0.055), (0.025, 0.015)), sides=10)


CHARACTERS = {
    "mira": {
        "materials": (
            ("Skin", (0.53, 0.27, 0.14, 1)),
            ("SageTunic", (0.34, 0.45, 0.28, 1)),
            ("HairBoot", (0.10, 0.065, 0.05, 1)),
            ("Terracotta", (0.48, 0.22, 0.10, 1)),
        ),
        "build": add_human,
        "eyes": ((-0.23, 0.22, 0.72), (0.23, 0.22, 0.72)),
    },
    "nolla": {
        "materials": (
            ("CreamFur", (0.76, 0.63, 0.43, 1)),
            ("RustShirt", (0.45, 0.18, 0.08, 1)),
            ("HornHoof", (0.12, 0.085, 0.06, 1)),
            ("MossApron", (0.29, 0.38, 0.22, 1)),
        ),
        "build": add_goat,
        "eyes": ((-0.22, 0.22, 0.7), (0.22, 0.22, 0.7)),
    },
    "kai": {
        "materials": (
            ("OtterFur", (0.46, 0.25, 0.13, 1)),
            ("HarborBlue", (0.15, 0.36, 0.42, 1)),
            ("DarkPaw", (0.08, 0.07, 0.06, 1)),
            ("SunScarf", (0.8, 0.48, 0.16, 1)),
        ),
        "build": add_otter,
        "eyes": ((-0.22, 0.19, 0.69), (0.22, 0.19, 0.69)),
    },
    "sera": {
        "materials": (
            ("OwlFeather", (0.54, 0.43, 0.29, 1)),
            ("TealDress", (0.16, 0.37, 0.35, 1)),
            ("BeakClaw", (0.64, 0.39, 0.12, 1)),
            ("CreamFeather", (0.78, 0.72, 0.58, 1)),
        ),
        "build": add_owl,
        "eyes": ((-0.27, 0.22, 0.72), (0.27, 0.22, 0.72)),
    },
}


class GlbWriter:
    def __init__(self) -> None:
        self.binary = bytearray()
        self.buffer_views: list[dict] = []
        self.accessors: list[dict] = []

    def align(self) -> None:
        while len(self.binary) % 4:
            self.binary.append(0)

    def accessor(
        self,
        payload: bytes,
        component_type: int,
        accessor_type: str,
        count: int,
        target: int | None = None,
        minimum: Sequence[float] | None = None,
        maximum: Sequence[float] | None = None,
    ) -> int:
        self.align()
        offset = len(self.binary)
        self.binary.extend(payload)
        view: dict = {"buffer": 0, "byteOffset": offset, "byteLength": len(payload)}
        if target:
            view["target"] = target
        view_index = len(self.buffer_views)
        self.buffer_views.append(view)
        accessor: dict = {
            "bufferView": view_index,
            "componentType": component_type,
            "count": count,
            "type": accessor_type,
        }
        if minimum is not None:
            accessor["min"] = list(minimum)
        if maximum is not None:
            accessor["max"] = list(maximum)
        accessor_index = len(self.accessors)
        self.accessors.append(accessor)
        return accessor_index


def floats(values: Iterable[float]) -> bytes:
    values = list(values)
    return struct.pack(f"<{len(values)}f", *values)


def uint16(values: Iterable[int]) -> bytes:
    values = list(values)
    return struct.pack(f"<{len(values)}H", *values)


def uint32(values: Iterable[int]) -> bytes:
    values = list(values)
    return struct.pack(f"<{len(values)}I", *values)


def animation_specs(
    bone_nodes: dict[str, int],
    eye_nodes: tuple[int, int],
) -> dict[str, tuple[list[float], list[tuple[int, str, list[Sequence[float]]]]]]:
    def channel(name: str, path: str, values: list[Sequence[float]]) -> tuple[int, str, list[Sequence[float]]]:
        return (bone_nodes[name], path, values)

    rest_hips = BONE_LOCAL_POSITIONS[1]
    loop5 = [0, 0.25, 0.5, 0.75, 1]
    return {
        "idle": (
            [0, 1, 2, 3, 4],
            [
                channel("Hips", "translation", [rest_hips, (0, 0.97, 0), rest_hips, (0, 0.965, 0), rest_hips]),
                channel("Spine", "rotation", [qz(-0.02), qz(0.025), qz(-0.018), qz(0.02), qz(-0.02)]),
                channel("Head", "rotation", [qy(-0.04), qy(0.02), qy(0.05), qy(-0.01), qy(-0.04)]),
            ],
        ),
        "walk": (
            loop5,
            [
                channel("UpperArm.L", "rotation", [qx(-0.45), qx(0), qx(0.45), qx(0), qx(-0.45)]),
                channel("UpperArm.R", "rotation", [qx(0.45), qx(0), qx(-0.45), qx(0), qx(0.45)]),
                channel("Thigh.L", "rotation", [qx(0.52), qx(0), qx(-0.52), qx(0), qx(0.52)]),
                channel("Thigh.R", "rotation", [qx(-0.52), qx(0), qx(0.52), qx(0), qx(-0.52)]),
                channel("Shin.L", "rotation", [qx(-0.18), qx(0.28), qx(0), qx(0.2), qx(-0.18)]),
                channel("Shin.R", "rotation", [qx(0), qx(0.2), qx(-0.18), qx(0.28), qx(0)]),
                channel("Hips", "translation", [rest_hips, (0, 0.98, 0), rest_hips, (0, 0.98, 0), rest_hips]),
            ],
        ),
        "run": (
            [0, 0.175, 0.35, 0.525, 0.7],
            [
                channel("UpperArm.L", "rotation", [qx(-0.78), qx(0), qx(0.78), qx(0), qx(-0.78)]),
                channel("UpperArm.R", "rotation", [qx(0.78), qx(0), qx(-0.78), qx(0), qx(0.78)]),
                channel("Thigh.L", "rotation", [qx(0.82), qx(0), qx(-0.82), qx(0), qx(0.82)]),
                channel("Thigh.R", "rotation", [qx(-0.82), qx(0), qx(0.82), qx(0), qx(-0.82)]),
                channel("Hips", "translation", [rest_hips, (0, 1.04, 0), rest_hips, (0, 1.04, 0), rest_hips]),
                channel("Spine", "rotation", [qx(0.12)] * 5),
            ],
        ),
        "talk": (
            [0, 0.5, 1, 1.5, 2],
            [
                channel("Head", "rotation", [qy(-0.08), qy(0.1), qy(-0.02), qy(0.08), qy(-0.08)]),
                channel("UpperArm.R", "rotation", [qz(0.12), qz(0.48), qz(0.2), qz(0.4), qz(0.12)]),
                channel("Forearm.R", "rotation", [qx(-0.2), qx(-0.62), qx(-0.35), qx(-0.52), qx(-0.2)]),
            ],
        ),
        "pickup": (
            [0, 0.35, 0.75, 1.1],
            [
                channel("Spine", "rotation", [qx(0), qx(0.48), qx(0.5), qx(0)]),
                channel("UpperArm.L", "rotation", [qx(0), qx(-0.75), qx(-0.82), qx(0)]),
                channel("UpperArm.R", "rotation", [qx(0), qx(-0.75), qx(-0.82), qx(0)]),
                channel("Hips", "translation", [rest_hips, (0, 0.8, 0.06), (0, 0.79, 0.06), rest_hips]),
            ],
        ),
        "interact": (
            [0, 0.35, 0.7, 1.05],
            [
                channel("UpperArm.R", "rotation", [qx(0), qx(-0.9), qx(-0.72), qx(0)]),
                channel("Forearm.R", "rotation", [qx(0), qx(-0.45), qx(-0.58), qx(0)]),
                channel("Head", "rotation", [qx(0), qx(0.1), qx(0.1), qx(0)]),
            ],
        ),
        "happy": (
            [0, 0.3, 0.6, 0.9, 1.2],
            [
                channel("UpperArm.L", "rotation", [qz(0), qz(-1.1), qz(-1.22), qz(-1.05), qz(0)]),
                channel("UpperArm.R", "rotation", [qz(0), qz(1.1), qz(1.22), qz(1.05), qz(0)]),
                channel("Hips", "translation", [rest_hips, (0, 1.08, 0), rest_hips, (0, 1.05, 0), rest_hips]),
            ],
        ),
        "surprised": (
            [0, 0.18, 0.7, 1.05],
            [
                channel("Head", "scale", [(1, 1, 1), (1.06, 1.06, 1.06), (1.04, 1.04, 1.04), (1, 1, 1)]),
                channel("UpperArm.L", "rotation", [qz(0), qz(-0.62), qz(-0.5), qz(0)]),
                channel("UpperArm.R", "rotation", [qz(0), qz(0.62), qz(0.5), qz(0)]),
            ],
        ),
        "blink": (
            [0, 0.08, 0.16, 0.26],
            [
                (eye_nodes[0], "scale", [(1, 1, 1), (1, 0.08, 1), (1, 0.08, 1), (1, 1, 1)]),
                (eye_nodes[1], "scale", [(1, 1, 1), (1, 0.08, 1), (1, 0.08, 1), (1, 1, 1)]),
            ],
        ),
    }


def write_character(character_id: str, definition: dict) -> dict:
    writer = GlbWriter()
    geometry = CharacterGeometry(len(definition["materials"]))
    definition["build"](geometry)

    materials = [
        {
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(color),
                "metallicFactor": 0,
                "roughnessFactor": 0.92,
            },
            "doubleSided": False,
        }
        for name, color in definition["materials"]
    ]
    primitives: list[dict] = []
    triangle_count = 0
    for material_index, surface in enumerate(geometry.surfaces):
        if not surface.positions:
            continue
        normals = vertex_normals(surface)
        flat_positions = [component for position in surface.positions for component in position]
        flat_normals = [component for normal in normals for component in normal]
        joint_values = [
            component
            for joint in surface.joints
            for component in (joint, 0, 0, 0)
        ]
        weight_values = [component for _ in surface.joints for component in (1.0, 0.0, 0.0, 0.0)]
        index_values = [index for face in surface.faces for index in face]
        minimum = [min(position[axis] for position in surface.positions) for axis in range(3)]
        maximum = [max(position[axis] for position in surface.positions) for axis in range(3)]
        position_accessor = writer.accessor(
            floats(flat_positions), 5126, "VEC3", len(surface.positions), 34962, minimum, maximum
        )
        normal_accessor = writer.accessor(
            floats(flat_normals), 5126, "VEC3", len(surface.positions), 34962
        )
        joint_accessor = writer.accessor(
            uint16(joint_values), 5123, "VEC4", len(surface.positions), 34962
        )
        weight_accessor = writer.accessor(
            floats(weight_values), 5126, "VEC4", len(surface.positions), 34962
        )
        index_accessor = writer.accessor(
            uint32(index_values), 5125, "SCALAR", len(index_values), 34963
        )
        primitives.append(
            {
                "attributes": {
                    "POSITION": position_accessor,
                    "NORMAL": normal_accessor,
                    "JOINTS_0": joint_accessor,
                    "WEIGHTS_0": weight_accessor,
                },
                "indices": index_accessor,
                "material": material_index,
            }
        )
        triangle_count += len(surface.faces)

    nodes: list[dict] = [{"name": f"{character_id}-character-root", "children": []}]
    character_root = 0
    bone_nodes: dict[str, int] = {}
    bone_world = bone_world_positions()
    for index, name in enumerate(BONE_NAMES):
        node_index = len(nodes)
        bone_nodes[name] = node_index
        nodes.append({"name": name, "translation": list(BONE_LOCAL_POSITIONS[index]), "children": []})
    for index, parent in enumerate(BONE_PARENTS):
        node_index = bone_nodes[BONE_NAMES[index]]
        if parent < 0:
            nodes[character_root]["children"].append(node_index)
        else:
            nodes[bone_nodes[BONE_NAMES[parent]]]["children"].append(node_index)

    main_mesh_node = len(nodes)
    nodes.append({"name": f"{character_id}-skinned-mesh", "mesh": 0, "skin": 0})
    nodes[character_root]["children"].append(main_mesh_node)

    # Layered eye meshes stay as Head children so blink can scale the full eye.
    eye_white_positions = [
        (-0.13, 0, 0),
        (-0.09, 0.16, 0.008),
        (0, 0.2, 0.012),
        (0.09, 0.16, 0.008),
        (0.13, 0, 0),
        (0.09, -0.16, 0.008),
        (0, -0.2, 0.012),
        (-0.09, -0.16, 0.008),
        (0, 0, 0.04),
    ]
    eye_white_faces = [(8, index, (index + 1) % 8) for index in range(8)]
    eye_white_position_accessor = writer.accessor(
        floats(component for point in eye_white_positions for component in point),
        5126,
        "VEC3",
        len(eye_white_positions),
        34962,
        (-0.13, -0.2, 0),
        (0.13, 0.2, 0.04),
    )
    eye_normal_accessor = writer.accessor(
        floats(component for point in [(0, 0, 1)] * len(eye_white_positions) for component in point),
        5126,
        "VEC3",
        len(eye_white_positions),
        34962,
    )
    eye_white_index_accessor = writer.accessor(
        uint32(index for face in eye_white_faces for index in face),
        5125,
        "SCALAR",
        len(eye_white_faces) * 3,
        34963,
    )
    pupil_positions = [
        (-0.06, 0, 0),
        (0, 0.1, 0.005),
        (0.06, 0, 0),
        (0, -0.1, 0.005),
        (0, 0, 0.025),
    ]
    pupil_faces = [(4, index, (index + 1) % 4) for index in range(4)]
    pupil_position_accessor = writer.accessor(
        floats(component for point in pupil_positions for component in point),
        5126, "VEC3", len(pupil_positions), 34962,
        (-0.06, -0.1, 0), (0.06, 0.1, 0.025),
    )
    pupil_normal_accessor = writer.accessor(
        floats(component for point in [(0, 0, 1)] * len(pupil_positions) for component in point),
        5126, "VEC3", len(pupil_positions), 34962,
    )
    pupil_index_accessor = writer.accessor(
        uint32(index for face in pupil_faces for index in face),
        5125, "SCALAR", len(pupil_faces) * 3, 34963,
    )
    eye_white_material = len(materials)
    materials.append(
        {
            "name": "EyeWhite",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.93, 0.86, 0.7, 1],
                "metallicFactor": 0,
                "roughnessFactor": 0.88,
            },
            "doubleSided": True,
        }
    )
    face_dark_material = len(materials)
    materials.append(
        {
            "name": "FaceDark",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.035, 0.025, 0.02, 1],
                "metallicFactor": 0,
                "roughnessFactor": 0.82,
            },
            "doubleSided": True,
        }
    )
    eye_nodes: list[int] = []
    for eye_index, eye in enumerate(definition["eyes"]):
        node_index = len(nodes)
        eye_nodes.append(node_index)
        nodes.append(
            {
                "name": f"Eye.{'L' if eye_index == 0 else 'R'}",
                "mesh": 1,
                "translation": list(eye),
                "children": [node_index + 1],
            }
        )
        nodes.append(
            {
                "name": f"Pupil.{'L' if eye_index == 0 else 'R'}",
                "mesh": 2,
                "translation": [0, 0, 0.045],
            }
        )
        nodes[bone_nodes["Head"]]["children"].append(node_index)

    mouth_node = len(nodes)
    nodes.append(
        {
            "name": "Smile",
            "mesh": 3,
            "translation": [0, -0.19, max(eye[2] for eye in definition["eyes"]) + 0.015],
        }
    )
    nodes[bone_nodes["Head"]]["children"].append(mouth_node)

    inverse_bind_values: list[float] = []
    for position in bone_world:
        inverse_bind_values.extend(
            (1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -position[0], -position[1], -position[2], 1)
        )
    inverse_bind_accessor = writer.accessor(
        floats(inverse_bind_values), 5126, "MAT4", len(BONE_NAMES)
    )

    animations: list[dict] = []
    for animation_name, (times, channels) in animation_specs(
        bone_nodes, (eye_nodes[0], eye_nodes[1])
    ).items():
        time_accessor = writer.accessor(
            floats(times), 5126, "SCALAR", len(times), None, (min(times),), (max(times),)
        )
        samplers: list[dict] = []
        gltf_channels: list[dict] = []
        for target_node, path, values in channels:
            accessor_type = "VEC4" if path == "rotation" else "VEC3"
            output_accessor = writer.accessor(
                floats(component for value in values for component in value),
                5126,
                accessor_type,
                len(values),
            )
            sampler_index = len(samplers)
            samplers.append(
                {"input": time_accessor, "output": output_accessor, "interpolation": "LINEAR"}
            )
            gltf_channels.append(
                {"sampler": sampler_index, "target": {"node": target_node, "path": path}}
            )
        animations.append(
            {"name": animation_name, "samplers": samplers, "channels": gltf_channels}
        )

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "Lumi Island original character generator",
            "copyright": "Original Lumi Island asset",
        },
        "scene": 0,
        "scenes": [{"name": f"{character_id}-scene", "nodes": [character_root]}],
        "nodes": nodes,
        "meshes": [
            {"name": f"{character_id}-body-mesh", "primitives": primitives},
            {
                "name": f"{character_id}-eye-white-mesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": eye_white_position_accessor,
                            "NORMAL": eye_normal_accessor,
                        },
                        "indices": eye_white_index_accessor,
                        "material": eye_white_material,
                    }
                ],
            },
            {
                "name": f"{character_id}-pupil-mesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": pupil_position_accessor,
                            "NORMAL": pupil_normal_accessor,
                        },
                        "indices": pupil_index_accessor,
                        "material": face_dark_material,
                    }
                ],
            },
            {
                "name": f"{character_id}-smile-mesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": writer.accessor(
                                floats((-0.13, 0.03, 0, -0.06, -0.035, 0.01, 0.06, -0.035, 0.01, 0.13, 0.03, 0, 0, -0.065, 0.02)),
                                5126, "VEC3", 5, 34962, (-0.13, -0.065, 0), (0.13, 0.03, 0.02),
                            ),
                            "NORMAL": writer.accessor(
                                floats((0, 0, 1) * 5), 5126, "VEC3", 5, 34962,
                            ),
                        },
                        "indices": writer.accessor(
                            uint32((0, 1, 4, 1, 2, 4, 2, 3, 4)), 5125, "SCALAR", 9, 34963,
                        ),
                        "material": face_dark_material,
                    }
                ],
            },
        ],
        "materials": materials,
        "skins": [
            {
                "name": f"{character_id}-rig",
                "inverseBindMatrices": inverse_bind_accessor,
                "skeleton": bone_nodes["Root"],
                "joints": [bone_nodes[name] for name in BONE_NAMES],
            }
        ],
        "animations": animations,
        "bufferViews": writer.buffer_views,
        "accessors": writer.accessors,
        "buffers": [{"byteLength": len(writer.binary)}],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "
    writer.align()
    bin_bytes = bytes(writer.binary)
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    glb = (
        struct.pack("<4sII", b"glTF", 2, total_length)
        + struct.pack("<I4s", len(json_bytes), b"JSON")
        + json_bytes
        + struct.pack("<I4s", len(bin_bytes), b"BIN\x00")
        + bin_bytes
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)
    path = OUTPUT / f"{character_id}.glb"
    path.write_bytes(glb)
    return {
        "id": character_id,
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "bytes": len(glb),
        "triangles": triangle_count + len(eye_white_faces) * 2 + len(pupil_faces) * 2 + 3,
        "materials": len(materials),
        "meshes": 4,
        "animations": len(animations),
    }


def main() -> None:
    manifest = [write_character(character_id, definition) for character_id, definition in CHARACTERS.items()]
    manifest_path = OUTPUT / "manifest.json"
    manifest_path.write_text(
        json.dumps({"generator": "scripts/generate_character_glbs.py", "characters": manifest}, indent=2),
        encoding="utf-8",
    )
    for entry in manifest:
        print(
            f"{entry['id']}: {entry['triangles']} triangles, "
            f"{entry['materials']} materials, {entry['bytes'] / 1024:.1f} KiB"
        )


if __name__ == "__main__":
    main()
