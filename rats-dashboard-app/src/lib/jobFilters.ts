import type { JobRecord } from '@/types/api';

export interface JobFilters {
  search: string;
  /** Selected companies; empty means all. */
  company: string[];
  /** Selected job levels; empty means all. */
  level: string[];
  /** A RANGE_OPTIONS value: how far back from the newest posting to look. */
  range: string;
}

export const RANGE_OPTIONS = [
  { value: '7d', label: '7D', days: 7 },
  { value: '14d', label: '14D', days: 14 },
  { value: '30d', label: '30D', days: 30 },
  { value: '90d', label: '90D', days: 90 },
  { value: 'all', label: 'All', days: null },
] as const;

/** Opens on the last 30 days so the dashboard never starts unbounded. */
export const DEFAULT_FILTERS: JobFilters = { search: '', company: [], level: [], range: '30d' };

const DAY_MS = 86_400_000;

function postedAt(job: JobRecord): number {
  const date = job.payload?.date_posted;
  const time = date && date !== '—' ? new Date(String(date)).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

/** Earliest posted time still inside the range, anchored at the newest posting; 0 means no limit. */
function rangeCutoff(jobs: JobRecord[], range: string): number {
  const days = RANGE_OPTIONS.find((option) => option.value === range)?.days;
  if (!days) return 0;
  const newest = Math.max(0, ...jobs.map(postedAt));
  return newest ? newest - (days - 1) * DAY_MS : 0;
}

function sameValues(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

export function sameFilters(a: JobFilters, b: JobFilters): boolean {
  return (
    a.search.trim() === b.search.trim() &&
    a.range === b.range &&
    sameValues(a.company, b.company) &&
    sameValues(a.level, b.level)
  );
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function matches(job: JobRecord, filters: JobFilters, cutoff: number, skip?: keyof JobFilters) {
  if (cutoff && postedAt(job) < cutoff) return false;
  if (skip !== 'company' && filters.company.length > 0) {
    if (!filters.company.includes(job.company_name ?? '')) return false;
  }
  if (skip !== 'level' && filters.level.length > 0) {
    if (!filters.level.includes(String(job.payload?.job_level))) return false;
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    return Boolean(
      job.job_title?.toLowerCase().includes(q) ||
      job.company_name?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q)
    );
  }
  return true;
}

/** Jobs passing every filter, newest first. */
export function filterJobs(jobs: JobRecord[], filters: JobFilters): JobRecord[] {
  const cutoff = rangeCutoff(jobs, filters.range);
  return jobs
    .filter((job) => matches(job, filters, cutoff))
    .sort((a, b) => postedAt(b) - postedAt(a));
}

/** Distinct company or level values still reachable given all the other active filters. */
export function facetOptions(
  jobs: JobRecord[],
  filters: JobFilters,
  facet: 'company' | 'level'
): string[] {
  const cutoff = rangeCutoff(jobs, filters.range);
  const values = new Set<string>();
  for (const job of jobs) {
    const value = facet === 'company' ? job.company_name : job.payload?.job_level;
    if (
      typeof value === 'string' &&
      value &&
      value !== '—' &&
      matches(job, filters, cutoff, facet)
    ) {
      values.add(value);
    }
  }
  return [...values].sort();
}
