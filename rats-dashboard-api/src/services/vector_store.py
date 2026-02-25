"""Qdrant + embedding service for job retrieval."""

from __future__ import annotations

from typing import Any

from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

from ..config import (
    COLLECTION_NAME,
    DEFAULT_BATCH_SIZE,
    EMBEDDING_MODEL_NAME,
    PASSAGE_EMBED_PREFIX,
    QUERY_EMBED_PREFIX,
    VECTOR_SIZE,
    require_env,
)
from ..schemas import JobMatch, JobRecord
from ..utils import build_job_embedding_text, build_point_id, chunks


class VectorStoreService:
    """Qdrant + embedding service for job retrieval."""

    def __init__(self) -> None:
        qdrant_url = require_env("QDRANT_URL")
        qdrant_api_key = require_env("QDRANT_API_KEY")
        self._collection_name = COLLECTION_NAME

        from pathlib import Path

        base_dir = Path(__file__).resolve().parent.parent.parent
        cache_dir = base_dir / "api" / "model_cache"

        self._embedder = TextEmbedding(model_name=EMBEDDING_MODEL_NAME, cache_dir=str(cache_dir))
        self._qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

    @property
    def collection_name(self) -> str:
        return self._collection_name

    def ensure_collection(self, recreate_collection: bool = False) -> None:
        """Create or recreate the Qdrant collection used for jobs."""
        if recreate_collection:
            self._qdrant.recreate_collection(
                collection_name=self._collection_name,
                vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
            )
            return

        if not self._qdrant.collection_exists(self._collection_name):
            self._qdrant.create_collection(
                collection_name=self._collection_name,
                vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
            )

    def collection_exists(self) -> bool:
        return self._qdrant.collection_exists(self._collection_name)

    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        vectors = self._embedder.embed(documents)
        return [vector.tolist() for vector in vectors]

    def embed_query(self, query: str) -> list[float]:
        vector = next(self._embedder.embed([query]))
        return vector.tolist()

    def upsert_jobs(self, jobs: list[dict[str, Any]], batch_size: int = DEFAULT_BATCH_SIZE) -> int:
        """Embed and upsert jobs to Qdrant in batches."""
        upserted_count = 0
        for batch in chunks(jobs, batch_size):
            base_texts = [build_job_embedding_text(job) for job in batch]
            prefixed_texts = [f"{PASSAGE_EMBED_PREFIX}{text}" for text in base_texts]
            vectors = self.embed_documents(prefixed_texts)
            points = [
                models.PointStruct(
                    id=build_point_id(job),
                    vector=vector,
                    payload={**job, "embedding_text": text},
                )
                for job, text, vector in zip(batch, base_texts, vectors, strict=False)
            ]
            self._qdrant.upsert(collection_name=self._collection_name, points=points, wait=True)
            upserted_count += len(points)
        return upserted_count

    def query_jobs(self, query_text: str, top_k: int, score_threshold: float | None) -> list[JobMatch]:
        """Search nearest jobs in Qdrant by a query text."""
        query_vector = self.embed_query(f"{QUERY_EMBED_PREFIX}{query_text}")
        query_response = self._qdrant.query_points(
            collection_name=self._collection_name,
            query=query_vector,
            limit=top_k,
            with_payload=True,
            score_threshold=score_threshold,
        )
        matches: list[JobMatch] = []
        for point in query_response.points:
            payload = dict(point.payload or {})
            matches.append(
                JobMatch(
                    score=float(point.score),
                    job_snapshot_id=payload.get("job_snapshot_id"),
                    job_id=payload.get("job_id"),
                    job_title=payload.get("job_title"),
                    company_name=payload.get("company_name"),
                    location=payload.get("location"),
                    job_url=payload.get("job_url"),
                    payload=payload,
                )
            )
        return matches

    def list_jobs(self, limit: int, offset: int | str | None) -> tuple[list[JobRecord], str | None, int]:
        """List jobs from Qdrant collection for frontend rendering."""
        records, next_offset = self._qdrant.scroll(
            collection_name=self._collection_name,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        total = self._qdrant.count(collection_name=self._collection_name, exact=True).count
        jobs: list[JobRecord] = []
        for record in records:
            payload = dict(record.payload or {})
            jobs.append(
                JobRecord(
                    point_id=str(record.id),
                    job_snapshot_id=payload.get("job_snapshot_id"),
                    job_id=payload.get("job_id"),
                    job_title=payload.get("job_title"),
                    company_name=payload.get("company_name"),
                    location=payload.get("location"),
                    job_url=payload.get("job_url"),
                    payload=payload,
                )
            )
        next_offset_value = str(next_offset) if next_offset is not None else None
        return jobs, next_offset_value, total
