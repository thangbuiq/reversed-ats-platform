"""Command-line interface for running the RATS Kafka producer."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import typer
from loguru import logger

from rats_kafka_producer.config.settings import ScraperConfig
from rats_kafka_producer.config.utils import load_config
from rats_kafka_producer.pipeline import RATSProducerApp

app = typer.Typer(
    name="rats-kafka-producer",
    help="Scrape job listings and publish them to Kafka.",
    add_completion=False,
)


def _build_overrides(
    location: str | None,
    results_wanted: int | None,
    fetch_description: bool | None,
    search_terms: list[str] | None,
    output_dir: Path | None,
    output_format: str | None,
) -> dict[str, Any]:
    """Build a config override dictionary from CLI options."""
    overrides: dict[str, Any] = {}

    if location:
        overrides["location"] = location
    if results_wanted is not None:
        overrides["results_wanted"] = results_wanted
    if fetch_description is not None:
        overrides["linkedin_fetch_description"] = fetch_description
    if search_terms:
        overrides["search_terms"] = search_terms
    if output_dir is not None:
        overrides["output_dir"] = str(output_dir)
    if output_format:
        overrides["output_format"] = output_format

    return overrides


@app.command("run")
def run_pipeline(
    config_file: Path | None = typer.Option(
        None,
        "--config",
        "-c",
        help="Path to a YAML/JSON config file.",
        exists=True,
        dir_okay=False,
        readable=True,
    ),
    search_terms: list[str] | None = typer.Option(
        None,
        "--search-term",
        "-s",
        help="Search terms to scrape. Repeat the flag for multiple terms.",
    ),
    location: str | None = typer.Option(
        None,
        "--location",
        "-l",
        help="Job location to target in the scrape.",
    ),
    results_wanted: int | None = typer.Option(
        None,
        "--results",
        "-r",
        min=1,
        max=1000,
        help="Maximum number of results to fetch per search term.",
    ),
    fetch_description: bool | None = typer.Option(
        None,
        "--fetch-description/--no-fetch-description",
        help="Include job descriptions in the scrape payloads.",
    ),
    output_dir: Path | None = typer.Option(
        None,
        "--output-dir",
        help="Optional local output directory for scraped data.",
    ),
    output_format: str | None = typer.Option(
        None,
        "--output-format",
        help="Output format for local exports: json, csv, or parquet.",
    ),
    produce: bool = typer.Option(
        True,
        "--produce/--no-produce",
        help="Enable or disable Kafka publishing.",
    ),
) -> None:
    """Run the scraping pipeline and optionally publish to Kafka."""
    overrides = _build_overrides(
        location=location,
        results_wanted=results_wanted,
        fetch_description=fetch_description,
        search_terms=search_terms,
        output_dir=output_dir,
        output_format=output_format,
    )

    config = load_config(config_file=config_file, overrides=overrides)

    logger.info("Starting RATS Kafka producer")
    with RATSProducerApp(config) as pipeline:
        stats = pipeline.run(search_terms=search_terms, produce_to_kafka=produce)

    typer.echo(
        json.dumps(
            stats.to_dict(),
            indent=2,
            default=str,
        )
    )


@app.command("config")
def show_config(
    config_file: Path | None = typer.Option(
        None,
        "--config",
        "-c",
        help="Path to a YAML/JSON config file.",
        exists=True,
        dir_okay=False,
        readable=True,
    ),
) -> None:
    """Print the effective configuration after merging all sources."""
    config = load_config(config_file=config_file)
    typer.echo(json.dumps(config.model_dump(), indent=2, default=str))


@app.command("validate")
def validate_config(
    config_file: Path | None = typer.Option(
        None,
        "--config",
        "-c",
        help="Path to a YAML/JSON config file.",
        exists=True,
        dir_okay=False,
        readable=True,
    ),
) -> None:
    """Validate configuration and exit with a success message."""
    config = load_config(config_file=config_file)
    _ = ScraperConfig(**config.model_dump())
    typer.echo("Configuration is valid.")


if __name__ == "__main__":
    app()
