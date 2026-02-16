"""Command-line interface for running the RATS Kafka producer."""

from __future__ import annotations

import inspect
import json
import os

import click
import typer

from rats_kafka_producer.config.settings import ScraperConfig
from rats_kafka_producer.config.utils import logger
from rats_kafka_producer.pipeline import RATSProducerApp


def _patch_click_make_metavar_for_typer() -> None:
    """Patch Click 8.2+ metavar signature for Typer compatibility."""
    params = inspect.signature(click.Parameter.make_metavar).parameters
    if "ctx" not in params:
        return

    original_make_metavar = click.Parameter.make_metavar

    def _compat_make_metavar(self: click.Parameter, ctx: click.Context | None = None) -> str:
        if ctx is None:
            ctx = click.Context(click.Command(name="rats-kafka-producer"))
        return original_make_metavar(self, ctx)

    click.Parameter.make_metavar = _compat_make_metavar  # type: ignore[assignment]


_patch_click_make_metavar_for_typer()

app = typer.Typer(
    name="rats-kafka-producer",
    help="Scrape job listings and publish them to Kafka.",
    add_completion=False,
)


def main() -> None:
    """Run the CLI without triggering Click's standalone SystemExit path."""
    app(standalone_mode=False)


@app.command("run")
def run_pipeline(
    produce: bool = typer.Option(
        True,
        "--produce/--no-produce",
        help="Enable or disable Kafka publishing.",
    ),
    job_location: str | None = typer.Option(None, "--job-location"),
    results_wanted: int | None = typer.Option(None, "--results-wanted"),
    hours_old: int | None = typer.Option(None, "--hours-old"),
    site_names: str | None = typer.Option(None, "--site-names"),
    search_terms: str | None = typer.Option(None, "--search-terms"),
    linkedin_fetch_description: str | None = typer.Option(None, "--linkedin-fetch-description"),
    log_level: str | None = typer.Option(None, "--log-level"),
    datacontract_kafka_bootstrap_servers: str | None = typer.Option(
        None,
        "--datacontract-kafka-bootstrap-servers",
    ),
    datacontract_kafka_sasl_username: str | None = typer.Option(
        None,
        "--datacontract-kafka-sasl-username",
    ),
    datacontract_kafka_sasl_password: str | None = typer.Option(
        None,
        "--datacontract-kafka-sasl-password",
    ),
    datacontract_kafka_topic: str | None = typer.Option(None, "--datacontract-kafka-topic"),
    confluent_schema_registry_url: str | None = typer.Option(None, "--confluent-schema-registry-url"),
    confluent_schema_registry_api_key: str | None = typer.Option(None, "--confluent-schema-registry-api-key"),
    confluent_schema_registry_api_secret: str | None = typer.Option(None, "--confluent-schema-registry-api-secret"),
    confluent_kafka_client_id: str | None = typer.Option(None, "--confluent-kafka-client-id"),
) -> None:
    """Run the scraping pipeline using configured search terms."""
    overrides = {
        "JOB_LOCATION": job_location,
        "RESULTS_WANTED": results_wanted,
        "HOURS_OLD": hours_old,
        "SITE_NAMES": site_names,
        "SEARCH_TERMS": search_terms,
        "LINKEDIN_FETCH_DESCRIPTION": linkedin_fetch_description,
        "LOG_LEVEL": log_level,
        "DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS": datacontract_kafka_bootstrap_servers,
        "DATACONTRACT_KAFKA_SASL_USERNAME": datacontract_kafka_sasl_username,
        "DATACONTRACT_KAFKA_SASL_PASSWORD": datacontract_kafka_sasl_password,
        "DATACONTRACT_KAFKA_TOPIC": datacontract_kafka_topic,
        "CONFLUENT_SCHEMA_REGISTRY_URL": confluent_schema_registry_url,
        "CONFLUENT_SCHEMA_REGISTRY_API_KEY": confluent_schema_registry_api_key,
        "CONFLUENT_SCHEMA_REGISTRY_API_SECRET": confluent_schema_registry_api_secret,
        "CONFLUENT_KAFKA_CLIENT_ID": confluent_kafka_client_id,
    }
    for key, value in overrides.items():
        if value is not None:
            os.environ[key] = str(value)

    logger.info("Starting RATS Kafka producer")
    with RATSProducerApp() as pipeline:
        pipeline.run(produce_to_kafka=produce)


@app.command("validate")
def validate_config() -> None:
    """Validate configuration and exit with a success message."""
    config = ScraperConfig.from_env()
    typer.echo("Configuration is valid:")
    typer.echo(json.dumps(config.model_dump(), indent=2, default=str))
    typer.echo("✅ Scraper configuration validation passed.")
    from rats_kafka_producer.datacontract.validate import run_validate_data_contract

    run_validate_data_contract()
    typer.echo("✅ Data contract validation passed.")


if __name__ == "__main__":
    main()
