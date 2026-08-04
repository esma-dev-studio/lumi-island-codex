"""Strict production acceptance gate for Lumi Island character GLBs.

The gate accepts original or rights-cleared reviewed assets with engine-ready rigs.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "public" / "assets" / "characters" / "models"
MANIFEST_PATH = MODEL_DIR / "manifest.json"
REQUIRED_CHARACTERS = ("mira", "nolla", "kai", "sera")
REQUIRED_BONES = {
    "Root", "Hips", "Head", "UpperArm.L", "UpperArm.R", "UpperLeg.L", "UpperLeg.R",
}
MIN_ANIMATION_COUNT = 9
COMPONENT_FORMATS = {
    5120: ("b", 1),
    5121: ("B", 1),
    5122: ("h", 2),
    5123: ("H", 2),
    5125: ("I", 4),
    5126: ("f", 4),
}
TYPE_COMPONENTS = {
    "SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4,
    "MAT2": 4, "MAT3": 9, "MAT4": 16,
}


def read_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("file is shorter than a GLB header")
    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total_length != len(data):
        raise ValueError("invalid GLB 2.0 header")
    json_length, json_type = struct.unpack_from("<I4s", data, 12)
    if json_type != b"JSON":
        raise ValueError("first GLB chunk is not JSON")
    document = json.loads(data[20 : 20 + json_length].decode("utf-8").rstrip(" \0"))
    binary_offset = 20 + json_length
    if binary_offset + 8 > len(data):
        return document, b""
    binary_length, binary_type = struct.unpack_from("<I4s", data, binary_offset)
    if binary_type != b"BIN\0":
        raise ValueError("second GLB chunk is not BIN")
    start = binary_offset + 8
    return document, data[start : start + binary_length]


def accessor_values(document: dict[str, Any], binary: bytes, index: int) -> list[tuple[float, ...]]:
    accessor = document["accessors"][index]
    if "sparse" in accessor:
        raise ValueError("sparse accessors are not supported by this gate")
    view = document["bufferViews"][accessor["bufferView"]]
    component_type = accessor["componentType"]
    fmt, component_size = COMPONENT_FORMATS[component_type]
    component_count = TYPE_COMPONENTS[accessor["type"]]
    packed_size = component_size * component_count
    stride = view.get("byteStride", packed_size)
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    values: list[tuple[float, ...]] = []
    for item_index in range(accessor["count"]):
        raw = struct.unpack_from(
            "<" + fmt * component_count,
            binary,
            offset + item_index * stride,
        )
        if accessor.get("normalized") and component_type != 5126:
            maximum = {5120: 127, 5121: 255, 5122: 32767, 5123: 65535, 5125: 4294967295}[component_type]
            raw = tuple(max(-1.0, value / maximum) for value in raw)
        values.append(tuple(float(value) for value in raw))
    return values


def count_triangles(document: dict[str, Any]) -> int:
    count = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            accessor_index = primitive.get("indices")
            if accessor_index is not None:
                count += document["accessors"][accessor_index]["count"] // 3
            else:
                position_index = primitive.get("attributes", {}).get("POSITION")
                if position_index is not None:
                    count += document["accessors"][position_index]["count"] // 3
    return count


def inspect_model(path: Path, manifest_entry: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        document, binary = read_glb(path)
    except Exception as error:  # noqa: BLE001 - report malformed delivery as gate data
        return {"file": path.name, "passed": False, "errors": [str(error)]}

    animations = {item.get("name") for item in document.get("animations", [])}
    if len(animations) < MIN_ANIMATION_COUNT:
        errors.append(f"too few authored animations: {len(animations)} (minimum {MIN_ANIMATION_COUNT})")

    node_names = {node.get("name") for node in document.get("nodes", [])}
    missing_bones = sorted(REQUIRED_BONES - node_names)
    if missing_bones:
        errors.append(f"missing required bones: {', '.join(missing_bones)}")

    skins = document.get("skins", [])
    if not skins:
        errors.append("model has no skin")
    joint_count = len(skins[0].get("joints", [])) if skins else 0
    if joint_count < len(REQUIRED_BONES):
        errors.append(f"skeleton has too few joints: {joint_count}")

    meshes = document.get("meshes", [])
    if not meshes:
        errors.append("model has no meshes")
    primitive_count = 0
    skinned_primitive_count = 0
    vertex_count = 0
    multi_joint_vertices = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            primitive_count += 1
            attributes = primitive.get("attributes", {})
            if "TEXCOORD_0" not in attributes:
                errors.append(f"primitive {primitive_count} has no UV0/TEXCOORD_0")
            if "JOINTS_0" not in attributes or "WEIGHTS_0" not in attributes:
                warnings.append(
                    f"primitive {primitive_count} is a rigid accessory without skin weights"
                )
                continue
            skinned_primitive_count += 1
            weight_accessor = document["accessors"][attributes["WEIGHTS_0"]]
            if weight_accessor.get("type") != "VEC4":
                errors.append(f"primitive {primitive_count} does not use at most 4 weights")
                continue
            try:
                weights = accessor_values(document, binary, attributes["WEIGHTS_0"])
            except Exception as error:  # noqa: BLE001
                errors.append(f"primitive {primitive_count} weights unreadable: {error}")
                continue
            vertex_count += len(weights)
            for vertex_weights in weights:
                if not math.isclose(sum(vertex_weights), 1.0, abs_tol=0.02):
                    errors.append(f"primitive {primitive_count} has non-normalized weight sums")
                    break
            multi_joint_vertices += sum(
                1 for vertex_weights in weights if sum(weight > 0.01 for weight in vertex_weights) >= 2
            )

    minimum_multi_weighted = max(10, math.ceil(vertex_count * 0.01))
    if skinned_primitive_count == 0:
        errors.append("model has no skinned primitive")
    if multi_joint_vertices < minimum_multi_weighted:
        errors.append(
            "too few vertices are weighted to multiple joints: "
            f"{multi_joint_vertices}/{vertex_count} (minimum {minimum_multi_weighted})"
        )

    images = document.get("images", [])
    textures = document.get("textures", [])
    if not images or not textures:
        errors.append("model has no embedded/external image texture")

    triangles = count_triangles(document)
    materials = len(document.get("materials", []))
    file_bytes = path.stat().st_size
    if not 80_000 <= file_bytes <= 5_000_000:
        errors.append(f"file size outside 80 KB–5 MB budget: {file_bytes}")
    if not 2_000 <= triangles <= 60_000:
        errors.append(f"triangle count outside 2k-60k budget: {triangles}")
    if not 1 <= materials <= 8:
        errors.append(f"material count outside 1–8 budget: {materials}")
    if manifest_entry.get("assetStatus") != "production-reviewed":
        errors.append("manifest assetStatus is not production-reviewed")
    if manifest_entry.get("visualReview") != "passed":
        errors.append("manifest visualReview is not passed")

    return {
        "file": path.name,
        "assetStatus": manifest_entry.get("assetStatus", "unspecified"),
        "bytes": file_bytes,
        "meshes": len(meshes),
        "primitives": primitive_count,
        "skinnedPrimitives": skinned_primitive_count,
        "triangles": triangles,
        "materials": materials,
        "images": len(images),
        "textures": len(textures),
        "joints": joint_count,
        "animations": len(animations),
        "multiJointVertices": multi_joint_vertices,
        "errors": errors,
        "warnings": warnings,
        "passed": not errors,
    }


def run_khronos(paths: list[Path]) -> tuple[str, dict[str, dict[str, Any]]]:
    """Run Khronos validation without turning a missing executable into a model failure."""
    command = ["node", str(ROOT / "scripts" / "khronos_validate.mjs"), *map(str, paths)]
    try:
        completed = subprocess.run(
            command,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as error:
        unavailable = {
            path.name: {"status": "unavailable", "runtimeError": str(error)}
            for path in paths
        }
        return "unavailable", unavailable

    if not completed.stdout:
        unavailable = {
            path.name: {
                "status": "unavailable",
                "runtimeError": completed.stderr.strip() or "Khronos validator produced no output",
            }
            for path in paths
        }
        return "unavailable", unavailable
    try:
        values = json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        unavailable = {
            path.name: {
                "status": "unavailable",
                "runtimeError": f"invalid Khronos output: {error}",
            }
            for path in paths
        }
        return "unavailable", unavailable

    by_name: dict[str, dict[str, Any]] = {}
    for value in values:
        errors = int(value.get("errors", 0))
        by_name[Path(value["file"]).name] = {
            **value,
            "status": "passed" if errors == 0 else "failed",
        }
    validator_status = "failed" if any(
        result.get("status") == "failed" for result in by_name.values()
    ) else "passed"
    return validator_status, by_name

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts" / "character-gate.json")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries = {entry["id"]: entry for entry in manifest.get("characters", [])}
    paths = [MODEL_DIR / f"{character}.glb" for character in REQUIRED_CHARACTERS]
    validator_status, khronos = run_khronos(paths)
    results = []
    for character, path in zip(REQUIRED_CHARACTERS, paths, strict=True):
        result = inspect_model(path, entries.get(character, {}))
        khronos_result = khronos.get(
            path.name,
            {"status": "unavailable", "runtimeError": "missing result"},
        )
        result["khronos"] = khronos_result
        if khronos_result.get("status") == "failed":
            result["errors"].append(
                f"Khronos glTF Validator errors: {khronos_result.get('errors', 1)}"
            )
        result["passed"] = not result["errors"]
        results.append(result)

    production_passed = all(result["passed"] for result in results)
    report = {
        "gate": "production-character-glb",
        "passed": production_passed,
        "validatorStatus": validator_status,
        "productionGateStatus": "passed" if production_passed else "failed",
        "visualReviewRequired": True,
        "visualReviewStatus": (
            "passed"
            if all(entry.get("visualReview") == "passed" for entry in entries.values())
            else "failed"
        ),
        "models": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=True, indent=2))
    raise SystemExit(0 if production_passed else 1)


if __name__ == "__main__":
    main()