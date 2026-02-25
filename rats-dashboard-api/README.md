# rats-dashboard-api

FastAPI backend serving job search requests and managing CV-to-job matching routines, relying upon the underlying materialized job data stored in the Qdrant Vector Database.

## Integration with Materialized Vector DB

- Raw crawled data flows from Kafka -> Delta Lake -> `rats-dbt-transformer`.
- `rats-vectordb-materializer` runs as a Databricks Job, computing embeddings for `analytical_layer.linkedin_jobs` and up-serting them into Qdrant.
- This `rats-dashboard-api` connects to Qdrant to perform Vector Search comparisons between user CV embeddings and job description embeddings, serving high-quality matching results to the `rats-dashboard-app`.

## Development

```bash
cd rats-dashboard-api
uv sync --all-groups --all-extras
```

Start the application locally:
```bash
uv run uvicorn src.main:app --reload
```

## Vercel Deployment

This project contains an `api/index.py` entry point and a `vercel.json` configuration file, allowing it to natively run on Vercel as a Serverless Function using the `@vercel/python` runtime. This setup is optimized alongside the `rats-dashboard-app`.
