# rats-dbt-transformer

dbt Core project for Databricks, initialized with `uv`.

## Project structure

This repo follows dbt best-practice layers:

- `models/staging/<source_system>/`: source-conformed, lightly transformed models
- `models/intermediate/<business_domain>/`: transformation-focused models
- `models/marts/<business_domain>/`: business-facing entities and facts

Naming conventions used:

- Staging: `stg_<source>__<entity>`
- Intermediate: `int_<entity>__<verb>`
- Marts: `<business_entity>`

## Prerequisites

- Python 3.12+
- `uv` installed
- Databricks SQL Warehouse (or cluster) access details

## Setup

1. Install dependencies:

```bash
uv sync
```

2. Create your dbt profile from template:

```bash
cp profiles.yml.example profiles.yml
```

3. Set Databricks credentials (example):

```bash
cp .env.example .env
set -a; source .env; set +a
```

4. Validate configuration:

```bash
./bin/dbt debug --profiles-dir .
```

5. Parse and run:

```bash
./bin/dbt parse --profiles-dir .
./bin/dbt run --profiles-dir .
./bin/dbt test --profiles-dir .
```

## Databricks deployment (Asset Bundle, scheduled)

This project uses Databricks Asset Bundles instead of Workflow `dbt_task`.
The bundle deploys a scheduled Python task that runs `dbt deps` and
`dbt build --select ...`.

For CLI auth (`databricks bundle ...`), set:

```bash
export DATABRICKS_HOST="https://dbc-<workspace>.cloud.databricks.com"
export DATABRICKS_TOKEN="dapi<personal-access-token>"
```

For job runtime connection values, pass bundle variables (plain or secret refs):

```bash
databricks bundle validate -t prod
databricks bundle validate
databricks bundle deploy -t prod \
    --var="dbt_host=${DATABRICKS_HOST}" \
    --var="dbt_http_path=${DATABRICKS_HTTP_PATH}" \
    --var="dbt_token=${DATABRICKS_TOKEN}"
databricks bundle run dbt_transform_schedule -t prod
```

Schedule config lives in:

- `databricks.yml` (variables + target)
- `deploy/databricks/resources/jobs.yml` (workflow + cron)
- `deploy/databricks/scripts/run_dbt.py` (dbt runner)

## Notes

- The profile template uses `method: token`, which aligns with dbt Databricks setup docs.
- You can switch to OAuth/service principal auth by updating `profiles.yml` per:
  https://docs.getdbt.com/docs/core/connect-data-platform/databricks-setup
