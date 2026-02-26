# RATS VectorDB Materializer

Databricks job that reads all jobs from `analytical_layer.linkedin_jobs` (after dbt transformations), computes vector embeddings using [BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), and upserts them into a Qdrant vector database for the RATS Dashboard API to serve search and CV matching.

## Architecture

```text
dbt transformation (analytical_layer.linkedin_jobs)
        |
        v
rats-vectordb-materializer (Databricks Job)
        |  1. Read all rows via Spark SQL
        |  2. Compute embeddings (BAAI/bge-small-en-v1.5)
        |  3. Upsert to Qdrant (linkedin_jobs collection)
        v
Qdrant Cloud ──> rats-dashboard-api (serve search & CV matching)
```

## Setup

```bash
cd rats-vectordb-materializer
cp .env.example .env
# fill in DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_HTTP_PATH, QDRANT_URL, QDRANT_API_KEY

uv sync --all-groups --all-extras
```

## Local Development

Run the materializer locally using Databricks Connect:

```bash
uv run rats-vectordb-materializer \
  --job_name materialize_to_qdrant \
  --host "$DATABRICKS_HOST" \
  --token "$DATABRICKS_TOKEN" \
  --qdrant_url "$QDRANT_URL" \
  --qdrant_api_key "$QDRANT_API_KEY"
```

## Deploy as Databricks Asset Bundle

Build and deploy to Databricks:

```bash
# validate the bundle
databricks bundle validate \
  --var qdrant_url="$QDRANT_URL" \
  --var qdrant_api_key="$QDRANT_API_KEY"

# deploy to production
databricks bundle deploy --target prod --force-lock \
  --var qdrant_url="$QDRANT_URL" \
  --var qdrant_api_key="$QDRANT_API_KEY"

# run the job immediately
databricks bundle run rats_vectordb_materializer --target prod
```

## Schedule

By default, the job is scheduled to run **daily at 06:00 UTC**, which should be after the dbt transformation jobs complete. Adjust the `daily_quartz_cron` variable in `databricks.yml` to change the schedule.

## Configuration

| Variable | Description | Default |
|---|---|---|
| `qdrant_url` | Qdrant Cloud cluster URL | *(required)* |
| `qdrant_api_key` | Qdrant Cloud API key | *(required)* |
| `databricks_table` | Source table | `analytical_layer.linkedin_jobs` |
| `batch_size` | Embedding + upsert batch size | `128` |
| `recreate_collection` | Recreate Qdrant collection on each run | `true` |

## Deployment Notes

The VectorDB materializer job must run **after** the DBT transformer completes. Ensure your orchestration pipeline has the correct dependency order.
