"""CV-to-job matching (predict) endpoint."""

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import COLLECTION_NAME
from ..dependencies import get_job_store, get_vector_store
from ..schemas import JobMatch, PredictResponse
from ..utils import extract_cv_text

logger = logging.getLogger(__name__)
router = APIRouter()


def _has_level(payload: dict, wanted_levels: set[str]) -> bool:
    """Return True when no level is requested or the job's level is one of them."""
    return not wanted_levels or str(payload.get("job_level") or "").lower() in wanted_levels


@router.post("/predict-best-match-job", response_model=PredictResponse)
async def predict_best_match_job(
    cv_file: UploadFile = File(...),
    top_k: int = Form(default=5, ge=1, le=50),
    score_threshold: float | None = Form(default=None),
    levels: list[str] = Form(default=[]),
) -> PredictResponse:
    """
    Upload CV, find nearest vectors in Qdrant, then load the job rows from Neon.

    When ``levels`` is given, the ``top_k`` nearest jobs are filtered down to those job levels.
    """
    try:
        vector_store = get_vector_store()
        job_store = get_job_store()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    cv_text = await extract_cv_text(cv_file)
    try:
        if not vector_store.collection_exists():
            raise HTTPException(
                status_code=503,
                detail="Job vectors are not ready yet. Run the rats-neon-backend pipeline first.",
            )
        wanted_levels = {level.strip().lower() for level in levels if level.strip()}
        hits = vector_store.query_jobs(cv_text, top_k=top_k, score_threshold=score_threshold)
        jobs = job_store.get_jobs([job_hash_id for job_hash_id, _ in hits])
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("CV matching failed")
        raise HTTPException(status_code=502, detail="Matching service is unavailable. Please try again.") from error

    matches = [
        JobMatch(
            score=score,
            job_snapshot_id=job_hash_id,
            job_id=job.job_id,
            job_title=job.job_title,
            company_name=job.company_name,
            location=job.location,
            job_url=job.job_url,
            payload=job.payload,
        )
        for job_hash_id, score in hits
        if (job := jobs.get(job_hash_id)) is not None and _has_level(job.payload, wanted_levels)
    ]
    return PredictResponse(collection_name=COLLECTION_NAME, total_matches=len(matches), matches=matches)
