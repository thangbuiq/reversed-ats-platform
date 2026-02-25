"""Shared utility functions for the RATS Dashboard API."""

from __future__ import annotations

import io
import os
import re
from typing import Any, Iterable

from fastapi import HTTPException, UploadFile

from .config import OUTPUT_SCHEMA_COLUMNS


def chunks[T](items: list[T], size: int) -> Iterable[list[T]]:
    """Yield successive chunks of *size* from *items*."""
    for index in range(0, len(items), size):
        yield items[index : index + size]


def stringify(value: Any) -> str:
    """Convert *value* to a cleaned string suitable for embedding text."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value).strip()


def build_job_embedding_text(job_row: dict[str, Any]) -> str:
    """Build a deterministic embedding text from the output schema fields."""
    parts: list[str] = []
    for column in OUTPUT_SCHEMA_COLUMNS:
        value = stringify(job_row.get(column))
        if value:
            parts.append(f"{column}: {value}")
    return "\n".join(parts)


def build_point_id(job_row: dict[str, Any]) -> str:
    """Create a stable point id from schema columns."""
    snapshot_id = stringify(job_row.get("job_snapshot_id"))
    if snapshot_id:
        return snapshot_id
    fallback = ":".join(
        stringify(job_row.get(column))
        for column in ("job_id", "part_date", "inserted_at")
        if stringify(job_row.get(column))
    )
    if fallback:
        return fallback
    raise RuntimeError("Cannot derive point id from job row.")


def linkedin_jobs_query(limit: int | None, offset: int = 0) -> str:
    """Build a SQL query for the LinkedIn jobs table."""
    columns = ", ".join(OUTPUT_SCHEMA_COLUMNS)
    table_name = os.getenv("DATABRICKS_TABLE", "analytical_layer.linkedin_jobs").strip()
    if not table_name:
        raise RuntimeError("DATABRICKS_TABLE is empty.")
    query = f"SELECT {columns} FROM {table_name}"
    query += " ORDER BY part_date DESC, inserted_at DESC, job_snapshot_id"
    if limit is not None:
        query += f" LIMIT {limit}"
    if offset > 0:
        query += f" OFFSET {offset}"
    return query


# ---- CV text extraction helpers ----


def decode_text_content(content: bytes) -> str:
    """Try common encodings for plain-text CV content."""
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="ignore")


def extract_pdf_text(content: bytes) -> str:
    """Extract text from a PDF byte stream."""
    try:
        from pypdf import PdfReader
    except ImportError as error:
        raise HTTPException(
            status_code=500,
            detail="PDF parsing requires pypdf. Install it before uploading PDF CV files.",
        ) from error

    reader = PdfReader(io.BytesIO(content))
    texts = []
    for page in reader.pages:
        texts.append(page.extract_text() or "")
    return "\n".join(texts)


async def extract_cv_text(cv_file: UploadFile) -> str:
    """Read and extract text from an uploaded CV file (PDF or plain text)."""
    content = await cv_file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded CV file is empty.")

    filename = (cv_file.filename or "").lower()
    content_type = (cv_file.content_type or "").lower()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        text = extract_pdf_text(content)
    else:
        text = decode_text_content(content)

    clean_text = re.sub(r"\s+", " ", text).strip()
    if len(clean_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="CV text extraction failed or produced too little text.",
        )
    return clean_text
