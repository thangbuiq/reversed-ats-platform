"""CV-to-job matching (predict) endpoint."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import COLLECTION_NAME
from ..dependencies import get_job_store, get_vector_store
from ..schemas import JobMatch, PredictResponse
from ..utils import extract_cv_text

router = APIRouter()


@router.post("/predict-best-match-job", response_model=PredictResponse)
async def predict_best_match_job(
    cv_file: UploadFile = File(...),
    top_k: int = Form(default=5, ge=1, le=50),
    score_threshold: float | None = Form(default=None),
) -> PredictResponse:
    """Upload CV, find nearest vectors in Qdrant, then load the job rows from Neon."""
    try:
        vector_store = get_vector_store()
        job_store = get_job_store()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if not vector_store.collection_exists():
        raise HTTPException(
            status_code=400,
            detail="Collection linkedin_jobs does not exist. Run the rats-neon-backend pipeline first.",
        )

    cv_text = await extract_cv_text(cv_file)
    hits = vector_store.query_jobs(cv_text, top_k=top_k, score_threshold=score_threshold)
    jobs = job_store.get_jobs([job_hash_id for job_hash_id, _ in hits])

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
        if (job := jobs.get(job_hash_id)) is not None
    ]
    return PredictResponse(collection_name=COLLECTION_NAME, total_matches=len(matches), matches=matches)
