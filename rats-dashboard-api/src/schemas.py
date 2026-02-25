"""Pydantic request / response schemas for the RATS Dashboard API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .config import DEFAULT_BATCH_SIZE


class MaterializeRequest(BaseModel):
    """Request payload for loading the LinkedIn jobs table into Qdrant."""

    limit: int | None = Field(default=None, ge=1)
    recreate_collection: bool = True
    batch_size: int = Field(default=DEFAULT_BATCH_SIZE, ge=1, le=2048)
    source_page_size: int = Field(default=2000, ge=100, le=10000)


class MaterializeResponse(BaseModel):
    """Response payload for materialization requests."""

    collection_name: str
    processed_rows: int
    upserted_points: int


class JobMatch(BaseModel):
    """A matched job payload returned by vector search."""

    score: float
    job_snapshot_id: str | None = None
    job_id: str | None = None
    job_title: str | None = None
    company_name: str | None = None
    location: str | None = None
    job_url: str | None = None
    payload: dict[str, Any]


class PredictResponse(BaseModel):
    """Response payload for CV-to-job matching."""

    collection_name: str
    total_matches: int
    matches: list[JobMatch]


class JobRecord(BaseModel):
    """A job record loaded from Qdrant payload."""

    point_id: str
    job_snapshot_id: str | None = None
    job_id: str | None = None
    job_title: str | None = None
    company_name: str | None = None
    location: str | None = None
    job_url: str | None = None
    payload: dict[str, Any]


class ShowAllJobsResponse(BaseModel):
    """Response payload for listing jobs from Qdrant."""

    collection_name: str
    total: int
    limit: int
    next_offset: str | None = None
    jobs: list[JobRecord]
