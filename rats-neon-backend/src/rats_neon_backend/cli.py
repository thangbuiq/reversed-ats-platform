"""Command-line interface for running the RATS Neon backend."""

from __future__ import annotations

import inspect
import json
import os

import click
import typer

from rats_neon_backend.backfill import payload_to_row
from rats_neon_backend.config.settings import ScraperConfig
from rats_neon_backend.config.utils import logger
from rats_neon_backend.pipeline import RATSBackendApp


def _patch_click_make_metavar_for_typer() -> None:
    """Patch Click 8.2+ metavar signature for Typer compatibility."""
    params = inspect.signature(click.Parameter.make_metavar).parameters
    if "ctx" not in params:
        return

    original_make_metavar = click.Parameter.make_metavar

    def _compat_make_metavar(self: click.Parameter, ctx: click.Context | None = None) -> str:
        if ctx is None:
            ctx = click.Context(click.Command(name="rats-neon-backend"))
        return original_make_metavar(self, ctx)

    click.Parameter.make_metavar = _compat_make_metavar  # type: ignore[assignment]


_patch_click_make_metavar_for_typer()

app = typer.Typer(
    name="rats-neon-backend",
    help="Scrape job listings and store them in Neon.",
    add_completion=False,
)


def main() -> None:
    """Run the CLI without triggering Click's standalone SystemExit path."""
    app(standalone_mode=False)


@app.command("run")
def run_pipeline(
    write: bool = typer.Option(
        True,
        "--write/--no-write",
        help="Enable or disable writing to Neon.",
    ),
    vectors: bool = typer.Option(
        True,
        "--vectors/--no-vectors",
        help="Embed new rows into Qdrant when QDRANT_URL is configured.",
    ),
    recreate_collection: bool = typer.Option(
        False,
        "--recreate-collection",
        help="Drop the Qdrant collection and re-embed every row.",
    ),
    job_location: str | None = typer.Option(None, "--job-location"),
    results_wanted: int | None = typer.Option(None, "--results-wanted"),
    hours_old: int | None = typer.Option(None, "--hours-old"),
    site_names: str | None = typer.Option(None, "--site-names"),
    search_terms: str | None = typer.Option(None, "--search-terms"),
    linkedin_fetch_description: str | None = typer.Option(None, "--linkedin-fetch-description"),
    log_level: str | None = typer.Option(None, "--log-level"),
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
    }
    for key, value in overrides.items():
        if value is not None:
            os.environ[key] = str(value)

    logger.info("Starting RATS Neon backend")
    stats = RATSBackendApp().run(
        write_to_database=write,
        sync_vectors=vectors,
        recreate_collection=recreate_collection,
    )
    if write and not stats.succeeded:
        raise typer.Exit(code=1)


@app.command("validate")
def validate_config() -> None:
    """Validate configuration and exit with a success message."""
    config = ScraperConfig.from_env()
    dump = config.model_dump()
    dump["database"]["url"] = "***" if config.database.url else ""
    dump["qdrant"]["api_key"] = "***" if config.qdrant.api_key else ""
    typer.echo("Configuration is valid:")
    typer.echo(json.dumps(dump, indent=2, default=str))
    if not config.database.url:
        raise typer.BadParameter("DATABASE_URL must be set.")
    typer.echo("Scraper configuration validation passed.")


@app.command("backfill-from-qdrant")
def backfill_from_qdrant() -> None:
    """Copy rows from the legacy Qdrant payloads into Neon (run once, before --recreate-collection)."""
    from rats_neon_backend.sinks.postgres import PostgresJobSink
    from rats_neon_backend.sinks.qdrant import QdrantVectorSink

    config = ScraperConfig.from_env()
    if not config.qdrant.enabled:
        raise typer.BadParameter("QDRANT_URL and QDRANT_API_KEY must be set.")
    sink = PostgresJobSink(config)
    total = 0
    for page in QdrantVectorSink(config.qdrant).scroll_payloads():
        rows = {row["job_hash_id"]: row for row in map(payload_to_row, page) if row}
        total += sink.upsert_rows(list(rows.values()))
        logger.info(f"Backfilled {total} rows")
    typer.echo(f"Backfill complete: {total} rows")


if __name__ == "__main__":
    main()
