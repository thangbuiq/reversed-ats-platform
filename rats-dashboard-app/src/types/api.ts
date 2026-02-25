/** TypeScript interfaces matching rats-dashboard-api schemas. */

export interface JobRecord {
  point_id: string;
  job_snapshot_id: string | null;
  job_id: string | null;
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  job_url: string | null;
  payload: Record<string, unknown>;
}

export interface ShowAllJobsResponse {
  collection_name: string;
  total: number;
  limit: number;
  next_offset: string | null;
  jobs: JobRecord[];
}

export interface JobMatch {
  score: number;
  job_snapshot_id: string | null;
  job_id: string | null;
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  job_url: string | null;
  payload: Record<string, unknown>;
}

export interface PredictResponse {
  collection_name: string;
  total_matches: number;
  matches: JobMatch[];
}
