"""
Materialize analytical_layer.linkedin_jobs into Qdrant vector database.

This job reads all jobs from the Databricks table via Spark, computes embeddings using BAAI/bge-small-en-v1.5, and
upserts the vectors + payloads into Qdrant. It is designed to run as a Databricks Asset Bundle job after dbt
transformations.
"""

from __future__ import annotations

import logging
from typing import Any

from databricks.connect import DatabricksSession
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

from rats_vectordb_materializer.config import (
    COLLECTION_NAME,
    DEFAULT_BATCH_SIZE,
    EMBEDDING_MODEL_NAME,
    OUTPUT_SCHEMA_COLUMNS,
    PASSAGE_EMBED_PREFIX,
    VECTOR_SIZE,
)
from rats_vectordb_materializer.utils import build_job_embedding_text, build_point_id, chunks

logger = logging.getLogger(__name__)


def _read_all_jobs(spark: DatabricksSession, table: str) -> list[dict[str, Any]]:
    """Read all rows from the analytical jobs table."""
    columns = ", ".join(OUTPUT_SCHEMA_COLUMNS)
    query = f"SELECT {columns} FROM {table} ORDER BY part_date DESC, inserted_at DESC"
    logger.info(f"Reading jobs from {table}")
    df = spark.sql(query)
    rows = [row.asDict() for row in df.collect()]
    logger.info(f"Read {len(rows)} jobs from {table}")
    return rows


def _materialize_to_qdrant(
    jobs: list[dict[str, Any]],
    qdrant_url: str,
    qdrant_api_key: str,
    batch_size: int = DEFAULT_BATCH_SIZE,
    recreate: bool = True,
) -> int:
    """Embed and upsert all jobs into Qdrant."""
    logger.info(f"Connecting to Qdrant at {qdrant_url}")
    qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    embedder = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)

    if recreate:
        logger.info(f"Recreating collection '{COLLECTION_NAME}'")
        qdrant.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
        )
    elif not qdrant.collection_exists(COLLECTION_NAME):
        logger.info(f"Creating collection '{COLLECTION_NAME}'")
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
        )

    upserted = 0
    total_batches = (len(jobs) + batch_size - 1) // batch_size

    for batch_idx, batch in enumerate(chunks(jobs, batch_size)):
        base_texts = [build_job_embedding_text(job) for job in batch]
        prefixed_texts = [f"{PASSAGE_EMBED_PREFIX}{text}" for text in base_texts]
        vectors = [v.tolist() for v in embedder.embed(prefixed_texts)]

        points = [
            models.PointStruct(
                id=build_point_id(job),
                vector=vector,
                payload={**job, "embedding_text": text},
            )
            for job, text, vector in zip(batch, base_texts, vectors, strict=False)
        ]
        qdrant.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)
        upserted += len(points)
        logger.info(f"Batch {batch_idx + 1}/{total_batches}: upserted {len(points)} points ({upserted} total)")

    logger.info(f"Materialization complete: {upserted} points in '{COLLECTION_NAME}'")
    return upserted


def pipeline():
    """Entry point called by the pipeline runner."""
    spark = DatabricksSession.builder.getOrCreate()

    # Read params set by the pipeline runner
    table = spark.sql("SELECT `params.databricks_table`").collect()[0][0] or "analytical_layer.linkedin_jobs"
    qdrant_url = spark.sql("SELECT `params.qdrant_url`").collect()[0][0]
    qdrant_api_key = spark.sql("SELECT `params.qdrant_api_key`").collect()[0][0]
    batch_size_str = spark.sql("SELECT `params.batch_size`").collect()[0][0]
    recreate_str = spark.sql("SELECT `params.recreate_collection`").collect()[0][0]

    batch_size = int(batch_size_str) if batch_size_str else DEFAULT_BATCH_SIZE
    recreate = str(recreate_str).lower() in ("true", "1", "yes", "")

    if not qdrant_url or not qdrant_api_key:
        raise RuntimeError("qdrant_url and qdrant_api_key are required parameters.")

    jobs = _read_all_jobs(spark, table)
    if not jobs:
        logger.warning("No jobs found in source table. Nothing to materialize.")
        return

    _materialize_to_qdrant(
        jobs=jobs,
        qdrant_url=qdrant_url,
        qdrant_api_key=qdrant_api_key,
        batch_size=batch_size,
        recreate=recreate,
    )
