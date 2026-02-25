"""List / browse jobs endpoint."""

from fastapi import APIRouter, HTTPException

from ..config import COLLECTION_NAME
from ..dependencies import get_vector_store
from ..schemas import ShowAllJobsResponse

router = APIRouter()


@router.get("/show-all-jobs", response_model=ShowAllJobsResponse)
def show_all_jobs(limit: int = 100, offset: str | None = None) -> ShowAllJobsResponse:
    """List jobs currently materialized in linkedin_jobs collection."""
    try:
        vector_store = get_vector_store()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if not vector_store.collection_exists():
        raise HTTPException(
            status_code=400,
            detail=("Collection linkedin_jobs does not exist. Call /materialize-linkedin-jobs first."),
        )

    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000.")

    parsed_offset: int | str | None = None
    if offset is not None and offset != "":
        parsed_offset = int(offset) if offset.isdigit() else offset

    jobs, next_offset, total = vector_store.list_jobs(limit=limit, offset=parsed_offset)
    return ShowAllJobsResponse(
        collection_name=COLLECTION_NAME,
        total=total,
        limit=limit,
        next_offset=next_offset,
        jobs=jobs,
    )
