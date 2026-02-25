# rats-dashboard-app

The Next.js frontend application for the RATS (Reversed ATS) platform. This application allows users to view job market trends and match their CVs with the materialized vector database of job listings.

## Integration with Materialized Vector DB & API

- The application communicates with the `rats-dashboard-api` to perform semantic searches and CV-job matching.
- The `rats-vectordb-materializer` runs separately on Databricks to vectorize dbt-transformed job data and insert it into a Qdrant vector database.
- `rats-dashboard-api` retrieves semantic embeddings and metrics from Qdrant and serves them to this Next.js app.
- Includes an intuitive UI with a localized CV File Upload preview mechanism for seamless user experience.

## Development

Install dependencies:

```bash
npm install
# or
yarn install
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Deployment

The application is configured to deploy easily on [Vercel](https://vercel.com) and incorporates the `Content-Security-Policy` security setup.
It integrates seamlessly into the RATS monorepo ecosystem.
