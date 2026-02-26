"""Configuration for RATS VectorDB Materializer."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

# -- Embedding & Qdrant constants --

COLLECTION_NAME = "linkedin_jobs"
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384
PASSAGE_EMBED_PREFIX = "Represent this sentence for retrieval: "
DEFAULT_BATCH_SIZE = 128

OUTPUT_SCHEMA_COLUMNS = (
    "part_date",
    "job_snapshot_id",
    "job_id",
    "site",
    "search_term",
    "company_name",
    "company_industry",
    "company_url",
    "location",
    "is_remote",
    "date_posted",
    "job_title",
    "job_type",
    "job_level",
    "job_function",
    "job_description",
    "job_url",
    "job_url_direct",
    "inserted_at",
)


class DatabricksAdditionalParams(BaseModel):
    """Extra CLI parameters forwarded to the Spark session as SQL variables."""

    qdrant_url: Optional[str] = None
    qdrant_api_key: Optional[str] = None
    databricks_table: Optional[str] = "analytical_layer.linkedin_jobs"
    batch_size: Optional[int] = DEFAULT_BATCH_SIZE
    recreate_collection: Optional[bool] = True


class DatabricksSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    databricks_host: Optional[str] = None
    databricks_token: Optional[str] = None

    def __init__(self, **data):
        super().__init__(**data)
        self.validate_settings()

    def validate_settings(self):
        if not self.databricks_host or not self.databricks_token:
            raise ValueError("Environment variables for Databricks are not set properly.")
