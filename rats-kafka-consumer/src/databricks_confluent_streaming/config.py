"""Configuration for Databricks Spark App."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabricksAdditionalParams(BaseModel):
    datacontract_kafka_bootstrap_servers: Optional[str] = None
    datacontract_kafka_sasl_username: Optional[str] = None
    datacontract_kafka_sasl_password: Optional[str] = None
    datacontract_kafka_sasl_mechanism: Optional[str] = None
    datacontract_kafka_topic: Optional[str] = None
    confluent_schema_registry_url: Optional[str] = None
    confluent_schema_registry_api_key: Optional[str] = None
    confluent_schema_registry_api_secret: Optional[str] = None
    checkpoint_base_path: Optional[str] = None
    run_environment: Optional[str] = "production"
    run_date: Optional[str] = "{{ job.start_time.iso_date }}"


class DatabricksSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    databricks_host: str
    databricks_token: str

    def __init__(self, **data):
        super().__init__(**data)
        self.validate_settings()

    def validate_settings(self):
        if not self.databricks_host or not self.databricks_token:
            raise ValueError("Environment variables for Databricks are not set properly.")
