/** Typed fetch helpers for the RATS Dashboard API. */

import type { JobRecord, ShowAllJobsResponse, PredictResponse } from '@/types/api';

const API_BASE = '/api';

/**
 * Fetch a page of jobs (newest first, without descriptions) from Neon via the API.
 */
export async function fetchJobs(limit = 100, offset?: string | null): Promise<ShowAllJobsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (offset) params.set('offset', offset);

  const res = await fetch(`${API_BASE}/show-all-jobs?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch jobs: ${res.status} – ${body}`);
  }
  return res.json();
}

/**
 * Fetch one job including its full description.
 */
export async function fetchJobDetail(jobHashId: string): Promise<JobRecord> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobHashId)}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch job: ${res.status} – ${body}`);
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
  form.append('cv_file', file);
  form.append('top_k', String(topK));
  if (scoreThreshold !== undefined) {
    form.append('score_threshold', String(scoreThreshold));
  }

  const res = await fetch(`${API_BASE}/predict-best-match-job`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

/** Turn an error response into a sentence a user can act on. */
async function readErrorMessage(res: Response): Promise<string> {
  if (res.status === 413) return 'This file is too large. Upload a CV under 4 MB.';
  const body = await res.text();
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.error ?? parsed?.detail;
    if (typeof message === 'string' && message) return message;
  } catch {
    // Fall through to the generic message.
  }
  return `Matching failed (${res.status}). Please try again.`;
}
