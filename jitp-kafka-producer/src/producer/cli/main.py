"""Professional CLI for the job scraper using Typer."""

import json
from pathlib import Path
from typing import Annotated, Optional

import typer
from rich.console import Console
from rich.table import Table

from producer import __version__
from producer.config.settings import load_config
from producer.pipeline import JobScraperPipeline
from producer.utils.logging import setup_logging

# Initialize CLI app
app = typer.Typer(
    name="scraper",
    help="Job Market Intelligence Platform - Web Scraper CLI",
    add_completion=True,
    no_args_is_help=True,
)

console = Console()


def version_callback(value: bool):
    if value:
        console.print(f"Job Scraper CLI v{__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: Annotated[
        Optional[bool],
        typer.Option("--version", "-v", callback=version_callback, is_eager=True),
    ] = None,
):
    """Job Market Intelligence Platform - Scraper CLI."""
    pass


@app.command("scrape")
def scrape(
    # Search terms as arguments
    search_terms: Annotated[
        Optional[list[str]],
        typer.Argument(help="Search terms for jobs (uses config default if not provided)"),
    ] = None,
    # Options
    location: Annotated[
        Optional[str],
        typer.Option("--location", "-l", help="Job location"),
    ] = None,
    results: Annotated[
        int,
        typer.Option("--results", "-n", help="Number of results per search term"),
    ] = 50,
    sites: Annotated[
        Optional[list[str]],
        typer.Option("--site", "-s", help="Job sites to scrape (linkedin, indeed, etc.)"),
    ] = None,
    # Kafka options
    no_kafka: Annotated[
        bool,
        typer.Option("--no-kafka", help="Skip Kafka production (scrape only)"),
    ] = False,
    # Config options
    config_file: Annotated[
        Optional[Path],
        typer.Option("--config", "-c", help="Path to config file (YAML/JSON)"),
    ] = None,
    # Output options
    output: Annotated[
        Optional[Path],
        typer.Option("--output", "-o", help="Output file path for results"),
    ] = None,
    # Logging options
    verbose: Annotated[
        bool,
        typer.Option("--verbose", "-V", help="Enable verbose logging"),
    ] = False,
    quiet: Annotated[
        bool,
        typer.Option("--quiet", "-q", help="Suppress output except errors"),
    ] = False,
):
    """
    Scrape job postings and optionally produce to Kafka.

    Examples:

    scraper scrape "Data Engineer" "ML Engineer" -l "New York"

    scraper scrape -n 50 --no-kafka -o jobs.json

    scraper scrape --config config.yaml
    """
    # Setup logging
    log_level = "DEBUG" if verbose else ("ERROR" if quiet else "INFO")
    setup_logging(level=log_level)

    # Build config overrides
    overrides = {}
    if location:
        overrides["location"] = location
    if results:
        overrides["results_wanted"] = results
    if sites:
        overrides["site_names"] = sites
    if search_terms:
        overrides["search_terms"] = list(search_terms)

    # Load configuration
    config = load_config(config_file, overrides)

    # Run pipeline
    try:
        with JobScraperPipeline(config) as pipeline:
            stats = pipeline.run(
                search_terms=list(search_terms) if search_terms else None,
                produce_to_kafka=not no_kafka,
            )

        # Output results
        if output:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(stats.to_dict(), indent=2, default=str))
            console.print(f"[blue]Results saved to:[/blue] {output}")

        if not quiet:
            _print_summary(stats)

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)


@app.command("run-config")
def run_from_config(
    config_file: Annotated[
        Path,
        typer.Argument(help="Path to config file with full scrape configuration"),
    ],
    dry_run: Annotated[
        bool,
        typer.Option("--dry-run", help="Validate config without running"),
    ] = False,
    no_kafka: Annotated[
        bool,
        typer.Option("--no-kafka", help="Skip Kafka production"),
    ] = False,
):
    """
    Run scraper from a configuration file.

    Useful for Airflow BashOperator:

    scraper run-config /path/to/config.yaml
    """
    if not config_file.exists():
        console.print(f"[red]Error:[/red] Config file not found: {config_file}")
        raise typer.Exit(1)

    config = load_config(config_file)

    if dry_run:
        console.print("[yellow]Dry run - configuration is valid[/yellow]")
        console.print(f"Search terms: {config.search_terms}")
        console.print(f"Location: {config.location}")
        console.print(f"Results per term: {config.results_wanted}")
        console.print(f"Sites: {config.site_names}")
        raise typer.Exit(0)

    setup_logging(level=config.log_level, log_file=config.log_file)

    with JobScraperPipeline(config) as pipeline:
        stats = pipeline.run(produce_to_kafka=not no_kafka)

    _print_summary(stats)


@app.command("run-json")
def run_from_json(
    json_input: Annotated[
        str,
        typer.Argument(help="JSON string with scrape parameters"),
    ],
):
    """
    Run scraper from a JSON string input.

    Useful for Airflow with templated JSON:

    scraper run-json '{"search_terms": ["python"], "location": "NYC"}'
    """
    try:
        params = json.loads(json_input)
    except json.JSONDecodeError as e:
        console.print(f"[red]Invalid JSON:[/red] {e}")
        raise typer.Exit(1)

    config = load_config(overrides=params)
    setup_logging(level=config.log_level)

    produce_to_kafka = params.get("produce_to_kafka", True)
    output_file = params.get("output")

    with JobScraperPipeline(config) as pipeline:
        stats = pipeline.run(produce_to_kafka=produce_to_kafka)

    # Output as JSON
    output_data = stats.to_dict()

    if output_file:
        Path(output_file).write_text(json.dumps(output_data, indent=2, default=str))
        console.print(f"Saved to {output_file}")
    else:
        print(json.dumps(output_data, default=str))


@app.command("config")
def show_config(
    config_file: Annotated[
        Optional[Path],
        typer.Option("--config", "-c", help="Path to config file"),
    ] = None,
):
    """Show current configuration."""
    config = load_config(config_file)

    table = Table(title="Scraper Configuration")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Search Terms", ", ".join(config.search_terms))
    table.add_row("Location", config.location)
    table.add_row("Results per Term", str(config.results_wanted))
    table.add_row("Sites", ", ".join(config.site_names))
    table.add_row("Kafka Bootstrap", config.kafka.bootstrap_servers)
    table.add_row("Kafka Topic", config.kafka.topic)
    table.add_row("Log Level", config.log_level)

    console.print(table)


def _print_summary(stats):
    """Print pipeline execution summary."""
    table = Table(title="Pipeline Execution Summary")
    table.add_column("Search Term", style="cyan")
    table.add_column("Scraped", justify="right")
    table.add_column("Produced", justify="right", style="green")
    table.add_column("Failed", justify="right", style="red")

    for term, result in stats.search_terms.items():
        table.add_row(
            term,
            str(result.scraped_count),
            str(result.produced_count),
            str(result.failed_count),
        )

    table.add_section()
    table.add_row(
        "[bold]Total[/bold]",
        f"[bold]{stats.total_jobs_scraped}[/bold]",
        f"[bold]{stats.total_jobs_produced}[/bold]",
        f"[bold]{stats.total_jobs_failed}[/bold]",
    )

    console.print(table)
    console.print(f"\n[dim]Duration: {stats.duration_seconds:.2f} seconds[/dim]")


if __name__ == "__main__":
    app()
