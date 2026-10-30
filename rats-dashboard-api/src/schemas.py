"""Pydantic request / response schemas for the RATS Dashboard API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


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
    """A job record loaded from Neon."""

    point_id: str
    job_snapshot_id: str | None = None
    job_id: str | None = None
    job_title: str | None = None
    company_name: str | None = None
    location: str | None = None
    job_url: str | None = None
    payload: dict[str, Any]


class ShowAllJobsResponse(BaseModel):
    """Response payload for listing jobs from Neon."""

    total: int
    limit: int
    next_offset: str | None = None
    jobs: list[JobRecord]
