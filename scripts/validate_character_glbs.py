"""Validate the original Lumi Island GLB character delivery contract."""

from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "public" / "assets" / "characters" / "models"
REQUIRED_ANIMATIONS = {
    "idle",
    "walk",
    "run",
    "talk",
    "pickup",
    "interact",
    "happy",
    "surprised",
    "blink",
}


def read_json_chunk(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("file is shorter than a GLB header")
    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total_length != len(data):
        raise ValueError("invalid GLB 2.0 header")
    chunk_length, chunk_type = struct.unpack_from("<I4s", data, 12)
    if chunk_type != b"JSON":
        raise ValueError("first GLB chunk is not JSON")
    return json.loads(data[20 : 20 + chunk_length].decode("utf-8").rstrip(" \0"))


def validate(path: Path) -> dict:
    document = read_json_chunk(path)
    names = {animation.get("name") for animation in document.get("animations", [])}
    missing = REQUIRED_ANIMATIONS - names
    if missing:
        raise ValueError(f"missing animations: {', '.join(sorted(missing))}")
    if not document.get("skins"):
        raise ValueError("model is not skinned")
    if not document.get("meshes"):
        raise ValueError("model has no meshes")
    joint_count = len(document["skins"][0].get("joints", []))
    if joint_count < 8:
        raise ValueError("skeleton has too few joints")
    return {
        "file": path.name,
        "bytes": path.stat().st_size,
        "meshes": len(document["meshes"]),
        "materials": len(document.get("materials", [])),
        "joints": joint_count,
        "animations": len(names),
    }


def main() -> None:
    results = []
    for character in ("mira", "nolla", "kai", "sera"):
        results.append(validate(MODEL_DIR / f"{character}.glb"))
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

