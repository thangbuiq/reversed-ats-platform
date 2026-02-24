"""Run dbt build from a Databricks workflow task."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Run dbt on Databricks Workflows.")
    parser.add_argument("--project-dir", required=True, help="Path to dbt project directory.")
    parser.add_argument("--profiles-dir", required=True, help="Path where profiles.yml is written.")
    parser.add_argument("--catalog", required=True, help="Databricks catalog.")
    parser.add_argument("--schema", required=True, help="Databricks schema.")
    parser.add_argument("--host", required=True, help="Databricks workspace host URL.")
    parser.add_argument("--http-path", required=True, help="Databricks SQL warehouse HTTP path.")
    parser.add_argument("--token", required=True, help="Databricks access token or secret reference.")
    parser.add_argument("--select", default="marts.linkedin", help="dbt selection syntax.")
    return parser.parse_args()


def write_profile(profiles_dir: Path, catalog: str, schema: str, host: str, http_path: str, token: str) -> None:
    """Write profiles.yml consumed by dbt."""
    profiles_dir.mkdir(parents=True, exist_ok=True)
    profile_path = profiles_dir / "profiles.yml"
    profile_path.write_text(
        "\n".join(
            [
                "rats_dbt_transformer:",
                "  target: prod",
                "  outputs:",
                "    prod:",
                "      type: databricks",
                "      method: token",
                f'      host: "{host}"',
                f'      http_path: "{http_path}"',
                f'      token: "{token}"',
                f'      catalog: "{catalog}"',
                f'      schema: "{schema}"',
                "      threads: 4",
                "",
            ]
        ),
        encoding="utf-8",
    )


def run_command(command: list[str], project_dir: Path) -> None:
    """Execute a dbt command and fail fast on error."""
    subprocess.run(command, cwd=project_dir, check=True)


def main() -> None:
    """Entrypoint for Databricks job task."""
    args = parse_args()
    project_dir = Path(args.project_dir).resolve()
    profiles_dir = Path(args.profiles_dir).resolve()

    write_profile(profiles_dir, args.catalog, args.schema, args.host, args.http_path, args.token)

    deps_command = [
        "dbt",
        "deps",
        "--project-dir",
        str(project_dir),
        "--profiles-dir",
        str(profiles_dir),
    ]
    build_command = [
        "dbt",
        "build",
        "--project-dir",
        str(project_dir),
        "--profiles-dir",
        str(profiles_dir),
        "--select",
        args.select,
    ]
    run_command(deps_command, project_dir)
    run_command(build_command, project_dir)


if __name__ == "__main__":
    main()
