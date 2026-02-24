"""Helper utilities for the confluent_to_delta job."""

import re
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pyspark.sql import SparkSession


class ConfluentSettings(BaseSettings):
    """Settings for Confluent Kafka and Schema Registry."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    datacontract_kafka_bootstrap_servers: str
    datacontract_kafka_sasl_username: str
    datacontract_kafka_sasl_password: str
    datacontract_kafka_sasl_mechanism: str = "PLAIN"
    datacontract_kafka_topic: str
    confluent_schema_registry_url: str
    confluent_schema_registry_api_key: str
    confluent_schema_registry_api_secret: str


class ConfluentEnvSettings(BaseSettings):
    """Optional settings source loaded from .env only."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    datacontract_kafka_bootstrap_servers: Optional[str] = None
    datacontract_kafka_sasl_username: Optional[str] = None
    datacontract_kafka_sasl_password: Optional[str] = None
    datacontract_kafka_sasl_mechanism: Optional[str] = None
    datacontract_kafka_topic: Optional[str] = None
    confluent_schema_registry_url: Optional[str] = None
    confluent_schema_registry_api_key: Optional[str] = None
    confluent_schema_registry_api_secret: Optional[str] = None


class JobPathSettings(BaseSettings):
    """Optional job path settings loaded from .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    checkpoint_base_path: Optional[str] = None


def clean(value: str) -> str:
    """Normalizes secrets read from env/params."""
    return value.strip()


def resolve_secret_reference(spark: SparkSession, value: Optional[str]) -> Optional[str]:
    """Resolves Databricks {{secrets/<scope>/<key>}} references to plaintext values."""
    if value is None:
        return None
    stripped_value = value.strip()
    match = re.match(r"^\{\{secrets/([^/]+)/([^}]+)\}\}$", stripped_value)
    if not match:
        return stripped_value

    scope, key = match.group(1), match.group(2)
    try:
        from pyspark.dbutils import DBUtils

        dbutils = DBUtils(spark)
        return dbutils.secrets.get(scope=scope, key=key)
    except Exception:
        # Fall back to the original reference so validation errors stay explicit downstream.
        return stripped_value


def build_kafka_jaas_config(mechanism: str, username: str, password: str) -> str:
    """Builds JAAS config using Databricks-shaded Kafka login modules."""
    normalized_mechanism = mechanism.strip().upper()
    login_module_by_mechanism = {
        "PLAIN": "kafkashaded.org.apache.kafka.common.security.plain.PlainLoginModule",
        "SCRAM-SHA-256": "kafkashaded.org.apache.kafka.common.security.scram.ScramLoginModule",
        "SCRAM-SHA-512": "kafkashaded.org.apache.kafka.common.security.scram.ScramLoginModule",
    }
    login_module = login_module_by_mechanism.get(normalized_mechanism)
    if login_module is None:
        raise ValueError(f"Unsupported SASL mechanism: {mechanism}")

    safe_username = clean(username).replace('"', '\\"')
    safe_password = clean(password).replace('"', '\\"')
    return f'{login_module} required username="{safe_username}" password="{safe_password}";'


def read_job_param(spark: SparkSession, param_name: str) -> Optional[str]:
    """Reads a Databricks job parameter if available."""
    try:
        value = spark.sql(f"SELECT `params.{param_name}` AS value").first()["value"]
    except Exception:
        return None
    if value in (None, "", "None"):
        return None
    return str(value)


def topic_to_table_name(topic_name: str) -> str:
    """Converts topic name to lowercase table name with underscore separators."""
    normalized = topic_name.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    normalized = re.sub(r"_+", "_", normalized)
    return normalized.strip("_")


def load_confluent_settings(spark: SparkSession) -> ConfluentSettings:
    """Loads settings with precedence: .env first, then CLI job params."""
    env_settings = ConfluentEnvSettings()
    resolved_values = {}

    for field_name in ConfluentSettings.model_fields:
        env_value = resolve_secret_reference(spark, getattr(env_settings, field_name))
        if env_value not in (None, ""):
            resolved_values[field_name] = env_value
            continue

        param_value = resolve_secret_reference(spark, read_job_param(spark, field_name))
        if param_value is not None:
            resolved_values[field_name] = param_value

    settings = ConfluentSettings(**resolved_values)
    cleaned_settings = ConfluentSettings(
        datacontract_kafka_bootstrap_servers=clean(settings.datacontract_kafka_bootstrap_servers),
        datacontract_kafka_sasl_username=clean(settings.datacontract_kafka_sasl_username),
        datacontract_kafka_sasl_password=clean(settings.datacontract_kafka_sasl_password),
        datacontract_kafka_sasl_mechanism=clean(settings.datacontract_kafka_sasl_mechanism),
        datacontract_kafka_topic=clean(settings.datacontract_kafka_topic),
        confluent_schema_registry_url=clean(settings.confluent_schema_registry_url),
        confluent_schema_registry_api_key=clean(settings.confluent_schema_registry_api_key),
        confluent_schema_registry_api_secret=clean(settings.confluent_schema_registry_api_secret),
    )
    for field_name in (
        "datacontract_kafka_sasl_username",
        "datacontract_kafka_sasl_password",
        "confluent_schema_registry_api_key",
        "confluent_schema_registry_api_secret",
    ):
        field_value = getattr(cleaned_settings, field_name, "")
        if re.match(r"^\{\{secrets/[^/]+/[^}]+\}\}$", field_value):
            raise ValueError(
                f"Unresolved Databricks secret reference for '{field_name}'. "
                "Ensure the scope/key exists and the job identity has permission."
            )
    return cleaned_settings


def resolve_checkpoint_location(spark: SparkSession, table_name: str) -> str:
    """Builds a streaming checkpoint path compatible with Databricks FS constraints."""
    path_settings = JobPathSettings()
    checkpoint_base_path = read_job_param(spark, "checkpoint_base_path") or path_settings.checkpoint_base_path
    if checkpoint_base_path is None or checkpoint_base_path.strip() == "":
        raise ValueError(
            "Missing checkpoint_base_path. Set --checkpoint_base_path or CHECKPOINT_BASE_PATH in .env "
            "to a Unity Catalog Volume path."
        )
    checkpoint_base_path = checkpoint_base_path.strip()
    if not re.match(r"^/Volumes/[^/]+/.+", checkpoint_base_path):
        raise ValueError(
            "Invalid checkpoint_base_path. Use only a Unity Catalog Volume path, e.g. "
            "'/Volumes/workspace/bronze/spark_streaming_checkpoints'."
        )
    return f"{checkpoint_base_path.rstrip('/')}/{table_name}"
