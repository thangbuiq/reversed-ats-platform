"""Main execution pipeline for RATS VectorDB Materializer."""

import argparse
import importlib
import os
import traceback
from types import ModuleType

from databricks.connect import DatabricksSession
from pyspark.errors import PySparkException
from pyspark.sql import SparkSession

from rats_vectordb_materializer.config import DatabricksAdditionalParams
from rats_vectordb_materializer.utils import get_databricks_settings, get_logger


def _is_sensitive_param(param_name: str) -> bool:
    sensitive_keywords = ("token", "password", "secret", "key", "api_key")
    return any(keyword in param_name.lower() for keyword in sensitive_keywords)


def _load_job_module(job_name: str) -> ModuleType:
    """Loads job module from either a module file or package entrypoint."""
    base_module_path = f"rats_vectordb_materializer.jobs.{job_name}"
    module = importlib.import_module(base_module_path)
    if hasattr(module, "pipeline"):
        return module

    try:
        entry_module = importlib.import_module(f"{base_module_path}.job")
    except ModuleNotFoundError as exc:
        raise AttributeError(
            f"Job '{job_name}' does not expose a pipeline() function. "
            f"Expected '{base_module_path}.pipeline' or '{base_module_path}.job.pipeline'."
        ) from exc
    if not hasattr(entry_module, "pipeline"):
        raise AttributeError(f"Job '{job_name}' entry module does not define pipeline().")
    return entry_module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_name", required=True, help="The job module to run defined in jobs/")
    parser.add_argument("--host", default=None, required=False, help="Databricks workspace URL")
    parser.add_argument("--token", default=None, required=False, help="Databricks token (PAT)")
    for field_name, field_configs in DatabricksAdditionalParams.model_fields.items():
        parser.add_argument(
            f"--{field_name}", default=field_configs.default, required=False, help=f"Job parameter: {field_name}"
        )
    args = parser.parse_args()
    logger = get_logger()
    job_name = args.job_name

    if "DATABRICKS_RUNTIME_VERSION" in os.environ:
        logger.info("Running in Databricks environment.")
        databricks_spark_session: SparkSession = DatabricksSession.builder.serverless(True).getOrCreate()
    else:
        logger.warning("Not running in Databricks environment. Attempting to connect using Databricks Connect.")
        settings = get_databricks_settings(args.host, args.token)
        databricks_spark_session: SparkSession = (
            DatabricksSession.builder.host(settings.databricks_host)
            .token(settings.databricks_token)
            .serverless(True)
            .getOrCreate()
        )

    try:
        for field_name in DatabricksAdditionalParams.model_fields.keys():
            param_value = vars(args).get(field_name)
            display_value = "***" if _is_sensitive_param(field_name) and param_value else param_value
            logger.info(f"Setting job parameter {field_name} from args: {display_value}")
            if param_value is not None:
                os.environ[f"params_{field_name}"] = str(param_value)
        logger.info(f"Initialized Spark {databricks_spark_session.version} session.")
        logger.info(f"Running job: {job_name}")
        job_module = _load_job_module(job_name)
        job_module.pipeline()
    except Exception as job_exception:
        logger.error(traceback.format_exc())
        raise PySparkException(f"Job {job_name} failed: {job_exception}") from job_exception
    finally:
        logger.info("Spark session stopped.")


if __name__ == "__main__":
    main()
