"""Avro schema utilities for the job listing payloads."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_schema_from_file(schema_path: Path) -> dict[str, Any]:
    """Load an Avro schema from a filesystem path."""
    if not schema_path.exists():
        raise FileNotFoundError(f"Avro schema not found at {schema_path}")

    with schema_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


ROOT_DIR = Path(__file__).resolve().parents[2]
JOB_LISTING_SCHEMA = load_schema_from_file(
    ROOT_DIR / "datacontract" / "schema" / "avro" / "com" / "rat" / "jobs" / "rats.job-listings.v1.avsc",
)
