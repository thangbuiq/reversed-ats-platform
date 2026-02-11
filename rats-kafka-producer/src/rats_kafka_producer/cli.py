"""Command-line interface for running the RATS Kafka producer."""

from __future__ import annotations

import inspect
import json

import click
import typer
from loguru import logger

from rats_kafka_producer.config.settings import ScraperConfig
from rats_kafka_producer.datacontract.validate import run_validate_data_contract
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


@app.command("run")
def run_pipeline(
    produce: bool = typer.Option(
        True,
        "--produce/--no-produce",
        help="Enable or disable Kafka publishing.",
    ),
) -> None:
    """Run the scraping pipeline using configured search terms."""
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
    run_validate_data_contract()
    typer.echo("✅ Data contract validation passed.")


if __name__ == "__main__":
    app()
