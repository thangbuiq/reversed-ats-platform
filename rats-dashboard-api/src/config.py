"""Application-wide constants and environment helpers."""

from __future__ import annotations

import os

APP_TITLE = "RATS Dashboard API"
COLLECTION_NAME = "linkedin_jobs"
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384
QUERY_EMBED_PREFIX = "Represent this sentence for searching relevant passages: "

LIST_COLUMNS = (
    "job_hash_id",
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
    "job_url",
    "job_url_direct",
    "part_date",
    "inserted_at",
)
DETAIL_COLUMNS = (*LIST_COLUMNS, "job_description")


def require_env(name: str) -> str:
    """Return a required environment variable or raise ``RuntimeError``."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value
