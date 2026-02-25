"""Materialize LinkedIn jobs into Qdrant endpoint."""

from fastapi import APIRouter, HTTPException

from ..config import COLLECTION_NAME
from ..dependencies import get_databricks_client, get_vector_store
from ..schemas import MaterializeRequest, MaterializeResponse
from ..utils import linkedin_jobs_query

router = APIRouter()


@router.post("/materialize-linkedin-jobs", response_model=MaterializeResponse)
def materialize_linkedin_jobs(request: MaterializeRequest) -> MaterializeResponse:
    """Materialize analytical_layer.linkedin_jobs into Qdrant vectors."""
    try:
        databricks_client = get_databricks_client()
        vector_store = get_vector_store()
        vector_store.ensure_collection(recreate_collection=request.recreate_collection)

        processed_rows = 0
        upserted = 0
        offset = 0
        remaining = request.limit

        while True:
            page_limit = request.source_page_size
            if remaining is not None:
                page_limit = min(page_limit, remaining)
                if page_limit <= 0:
                    break

            rows = databricks_client.fetch_rows(linkedin_jobs_query(page_limit, offset=offset))
            if not rows:
                break

            upserted += vector_store.upsert_jobs(rows, batch_size=request.batch_size)
            processed_rows += len(rows)
            offset += len(rows)

            if len(rows) < page_limit:
                break
            if remaining is not None:
                remaining -= len(rows)
                if remaining <= 0:
                    break
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return MaterializeResponse(
        collection_name=COLLECTION_NAME,
        processed_rows=processed_rows,
        upserted_points=upserted,
    )
