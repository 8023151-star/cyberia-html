#!/usr/bin/env python3
"""Copy the release number from version.txt into the local-file script."""

from pathlib import Path
import json
import re

root = Path(__file__).resolve().parent
version = (root / "version.txt").read_text(encoding="utf-8").strip()
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    raise SystemExit("version.txt must contain a version like 0.0.2")

(root / "version.js").write_text(
    "// Generated from version.txt by sync-version.py.\n"
    f"window.CYBERIA_VERSION = {json.dumps(version)};\n",
    encoding="utf-8",
)
print(f"Synced local version: {version}")
