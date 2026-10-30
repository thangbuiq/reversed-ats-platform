/** Base URL of the RATS Dashboard API, configured via NEXT_PUBLIC_API_URL in .env. */
export const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(
  /\/+$/,
  ''
);
