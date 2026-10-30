"""Qdrant + embedding service used only by the CV matcher."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastembed import TextEmbedding
from qdrant_client import QdrantClient

from ..config import COLLECTION_NAME, EMBEDDING_MODEL_NAME, QUERY_EMBED_PREFIX, require_env


class VectorStoreService:
    """Embeds a CV and returns the nearest job hash ids from Qdrant."""

    def __init__(self) -> None:
        qdrant_url = require_env("QDRANT_URL")
        qdrant_api_key = require_env("QDRANT_API_KEY")
        self._collection_name = COLLECTION_NAME

        base_dir = Path(__file__).resolve().parent.parent.parent
        cache_dir = base_dir / "api" / "model_cache"

        self._embedder = TextEmbedding(model_name=EMBEDDING_MODEL_NAME, cache_dir=str(cache_dir))
        self._qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

    def collection_exists(self) -> bool:
        return self._qdrant.collection_exists(self._collection_name)

    def embed_query(self, query: str) -> list[float]:
        vector = next(self._embedder.embed([query]))
        return vector.tolist()

    def query_jobs(self, query_text: str, top_k: int, score_threshold: float | None) -> list[tuple[str, float]]:
        """Return ``(job_hash_id, score)`` pairs for the nearest jobs, best first."""
        query_response = self._qdrant.query_points(
            collection_name=self._collection_name,
            query=self.embed_query(f"{QUERY_EMBED_PREFIX}{query_text}"),
            limit=top_k,
            with_payload=False,
            score_threshold=score_threshold,
        )
        return [(uuid.UUID(str(point.id)).hex, float(point.score)) for point in query_response.points]
