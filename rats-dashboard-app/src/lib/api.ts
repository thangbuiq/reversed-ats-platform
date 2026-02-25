/** Typed fetch helpers for the RATS Dashboard API. */

import type { ShowAllJobsResponse, PredictResponse } from "@/types/api";

const API_BASE = "/api";

/**
 * Fetch paginated jobs from Qdrant via the API.
 */
export async function fetchJobs(
  limit = 100,
  offset?: string | null
): Promise<ShowAllJobsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (offset) params.set("offset", offset);

  const res = await fetch(`${API_BASE}/show-all-jobs?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch jobs: ${res.status} – ${body}`);
  }
  return res.json();
}

/**
 * Upload a CV file and get the best matching jobs.
 */
export async function predictBestMatchJob(
  file: File,
  topK = 10,
  scoreThreshold?: number
): Promise<PredictResponse> {
  const form = new FormData();
  form.append("cv_file", file);
  form.append("top_k", String(topK));
  if (scoreThreshold !== undefined) {
    form.append("score_threshold", String(scoreThreshold));
  }

  const res = await fetch(`${API_BASE}/predict-best-match-job`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Prediction failed: ${res.status} – ${body}`);
  }
  return res.json();
}
