"""One-off migration: rebuild Neon rows from legacy Qdrant payloads (which hold the full Databricks rows)."""

from __future__ import annotations

from typing import Any

from rats_neon_backend.config.models import compute_job_hash_id

ROW_COLUMNS = (
    "job_id",
    "site",
    "search_term",
    "company_name",
    "company_industry",
    "company_url",
    "location",
    "is_remote",
    "date_posted",
    "job_title",
    "job_type",
    "job_level",
    "job_function",
    "job_description",
    "job_url",
    "job_url_direct",
    "part_date",
    "inserted_at",
)


def payload_to_row(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Map a legacy Qdrant payload to a linkedin_jobs row, or None when it lacks a usable identity."""
    row = {column: payload.get(column) for column in ROW_COLUMNS}
    row["job_hash_id"] = compute_job_hash_id(
        row["company_name"], row["job_title"], row["job_description"], row["job_level"]
    )
    row["job_id"] = str(row["job_id"] or row["job_hash_id"])
    row["date_posted"] = str(row["date_posted"])[:10] if row["date_posted"] else None
    row["part_date"] = str(row["part_date"] or row["date_posted"] or "")[:10] or None
    row["inserted_at"] = str(row["inserted_at"]) if row["inserted_at"] else None
    if not row["part_date"]:
        return None
    return {key: value for key, value in row.items() if value is not None}
