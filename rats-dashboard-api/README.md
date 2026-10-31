# rats-dashboard-api

FastAPI backend serving the dashboard's job listings from Neon (PostgreSQL) and the CV-to-job matching feature, which is the only part that uses the Qdrant Vector Database.

## Data flow

- `rats-neon-backend` scrapes LinkedIn daily, upserts rows into Neon `linkedin_jobs`, and embeds new rows into Qdrant.
- `GET /show-all-jobs` and `GET /jobs/{job_hash_id}` read only from Neon. The list omits `job_description`; the detail endpoint returns it.
- `POST /predict-best-match-job` embeds the uploaded CV, finds the nearest vectors in Qdrant (ids only), then loads the matching rows from Neon.

Required environment: `DATABASE_URL` (pooled Neon connection string), `QDRANT_URL`, `QDRANT_API_KEY`, `CF_ACCOUNT_ID`, `CF_API_TOKEN` (Cloudflare Workers AI, used for CV query embeddings).

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
