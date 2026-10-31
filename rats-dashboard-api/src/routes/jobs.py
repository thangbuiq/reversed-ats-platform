"""List / browse jobs endpoints, backed by Neon."""

from fastapi import APIRouter, HTTPException, Response

from ..dependencies import get_job_store
from ..schemas import JobRecord, ShowAllJobsResponse

router = APIRouter()

JOB_DETAIL_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600"


@router.get("/show-all-jobs", response_model=ShowAllJobsResponse)
def show_all_jobs(
    limit: int = 100,
    offset: str | None = None,
    include_description: bool = False,
) -> ShowAllJobsResponse:
    """
    List jobs newest first.

    Descriptions are omitted unless include_description is true; /jobs/{job_hash_id} also returns one.
    """
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000.")
    if offset and not offset.isdigit():
        raise HTTPException(status_code=400, detail="offset must be a non-negative integer.")
    start = int(offset) if offset else 0

    try:
        jobs, total = get_job_store().list_jobs(limit=limit, offset=start, include_description=include_description)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    next_start = start + len(jobs)
    return ShowAllJobsResponse(
        total=total,
        limit=limit,
        next_offset=str(next_start) if len(jobs) == limit and next_start < total else None,
        jobs=jobs,
    )


@router.get("/jobs/{job_hash_id}", response_model=JobRecord)
def get_job(job_hash_id: str, response: Response) -> JobRecord:
    """Return one job including its full description, cacheable at the CDN."""
    try:
        job = get_job_store().get_job(job_hash_id)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    response.headers["Cache-Control"] = JOB_DETAIL_CACHE_CONTROL
    return job
