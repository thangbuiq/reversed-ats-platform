"""Qdrant + embedding service used only by the CV matcher."""

from __future__ import annotations

import uuid

import httpx
from qdrant_client import QdrantClient

from ..config import COLLECTION_NAME, EMBEDDING_MODEL_NAME, EMBEDDING_TIMEOUT_SECONDS, QUERY_EMBED_PREFIX, require_env


class VectorStoreService:
    """Embeds a CV and returns the nearest job hash ids from Qdrant."""

    def __init__(self) -> None:
        qdrant_url = require_env("QDRANT_URL")
        qdrant_api_key = require_env("QDRANT_API_KEY")
        self._collection_name = COLLECTION_NAME

        account_id = require_env("CF_ACCOUNT_ID")
        self._embedder = httpx.Client(
            base_url=f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/",
            headers={"Authorization": f"Bearer {require_env('CF_API_TOKEN')}"},
            timeout=EMBEDDING_TIMEOUT_SECONDS,
        )
        self._qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

    def collection_exists(self) -> bool:
        return self._qdrant.collection_exists(self._collection_name)

    def embed_query(self, query: str) -> list[float]:
        response = self._embedder.post(EMBEDDING_MODEL_NAME, json={"text": [query]})
        response.raise_for_status()
        return response.json()["result"]["data"][0]

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
