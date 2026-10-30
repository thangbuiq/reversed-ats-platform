"""
Optional Qdrant sink: embeds jobs for the CV matcher.

Rows live in Neon, vectors here.
"""

from __future__ import annotations

import uuid
from typing import Any, Iterable

from rats_neon_backend.config.settings import QdrantConfig
from rats_neon_backend.config.utils import logger

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384
PASSAGE_EMBED_PREFIX = "Represent this sentence for retrieval: "
EMBEDDING_TEXT_FIELDS = ("company_name", "job_title", "job_description", "job_level")


def build_embedding_text(row: dict[str, Any]) -> str:
    """Build a deterministic embedding text from selected job fields."""
    parts = [f"{column}: {str(row[column]).strip()}" for column in EMBEDDING_TEXT_FIELDS if row.get(column)]
    return "\n".join(parts)


def point_id(job_hash_id: str) -> str:
    """Map the md5 job_hash_id to a Qdrant-compatible UUID (same bytes, so it is reversible)."""
    return str(uuid.UUID(hex=job_hash_id))


def _chunks(items: list[Any], size: int) -> Iterable[list[Any]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


class QdrantVectorSink:
    """Embeds job rows with fastembed and upserts them (id + hash payload only) into Qdrant."""

    def __init__(self, config: QdrantConfig):
        from fastembed import TextEmbedding
        from qdrant_client import QdrantClient

        self.config = config
        self._qdrant = QdrantClient(url=config.url, api_key=config.api_key, timeout=60.0)
        self._embedder = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)

    def ensure_collection(self, recreate: bool = False) -> None:
        """Create the collection, or drop and recreate it when requested."""
        from qdrant_client import models

        if recreate and self._qdrant.collection_exists(self.config.collection):
            self._qdrant.delete_collection(self.config.collection)
        if not self._qdrant.collection_exists(self.config.collection):
            self._qdrant.create_collection(
                collection_name=self.config.collection,
                vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
            )

    def upsert_rows(self, rows: list[dict[str, Any]]) -> list[str]:
        """
        Embed and upsert rows.

        Returns the job_hash_ids that were stored.
        """
        from qdrant_client import models

        stored: list[str] = []
        for batch in _chunks(rows, self.config.embed_batch_size):
            texts = [f"{PASSAGE_EMBED_PREFIX}{build_embedding_text(row)}" for row in batch]
            vectors = [vector.tolist() for vector in self._embedder.embed(texts)]
            points = [
                models.PointStruct(
                    id=point_id(row["job_hash_id"]),
                    vector=vector,
                    payload={"job_hash_id": row["job_hash_id"]},
                )
                for row, vector in zip(batch, vectors, strict=True)
            ]
            self._qdrant.upsert(collection_name=self.config.collection, points=points, wait=True)
            stored.extend(row["job_hash_id"] for row in batch)
            logger.info(f"Upserted {len(stored)}/{len(rows)} vectors")
        return stored

    def delete(self, job_hash_ids: list[str]) -> None:
        """Remove vectors for jobs that were purged from Neon."""
        from qdrant_client import models

        for batch in _chunks(job_hash_ids, 500):
            self._qdrant.delete(
                collection_name=self.config.collection,
                points_selector=models.PointIdsList(points=[point_id(job_hash_id) for job_hash_id in batch]),
                wait=True,
            )

    def scroll_payloads(self, page_size: int = 500) -> Iterable[list[dict[str, Any]]]:
        """Yield pages of payloads from the collection (used to backfill Neon from legacy points)."""
        offset = None
        while True:
            records, offset = self._qdrant.scroll(
                collection_name=self.config.collection,
                limit=page_size,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            if records:
                yield [dict(record.payload or {}) for record in records]
            if offset is None:
                break
