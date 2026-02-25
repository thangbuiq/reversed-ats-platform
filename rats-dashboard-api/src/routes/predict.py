"""CV-to-job matching (predict) endpoint."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import COLLECTION_NAME
from ..dependencies import get_vector_store
from ..schemas import PredictResponse
from ..utils import extract_cv_text

router = APIRouter()


@router.post("/predict-best-match-job", response_model=PredictResponse)
async def predict_best_match_job(
    cv_file: UploadFile = File(...),
    top_k: int = Form(default=5, ge=1, le=50),
    score_threshold: float | None = Form(default=None),
) -> PredictResponse:
    """Upload CV and return top-k best matching jobs from Qdrant."""
    try:
        vector_store = get_vector_store()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if not vector_store.collection_exists():
        raise HTTPException(
            status_code=400,
            detail=("Collection linkedin_jobs does not exist. Call /materialize-linkedin-jobs first."),
        )

    cv_text = await extract_cv_text(cv_file)
    matches = vector_store.query_jobs(cv_text, top_k=top_k, score_threshold=score_threshold)
    return PredictResponse(
        collection_name=COLLECTION_NAME,
        total_matches=len(matches),
        matches=matches,
    )
