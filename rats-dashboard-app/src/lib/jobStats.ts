import type { JobRecord } from '@/types/api';

export type LevelCounts = Record<string, number>;

export interface DailyStat {
  date: string;
  count: number;
  topCompany: string | null;
  levelCounts: LevelCounts;
}

export interface CompanyStat {
  name: string;
  count: number;
  share: number;
  topLocation: string | null;
  levelCounts: LevelCounts;
}

export interface JobStats {
  total: number;
  uniqueCompanies: number;
  avgPerCompany: number;
  latestDate: string | null;
  latestCount: number;
  daily: DailyStat[];
  topCompanies: CompanyStat[];
  topLocation: string | null;
  /** Every job level present, most frequent first. */
  levels: string[];
}

const TOP_COMPANY_LIMIT = 8;
const UNKNOWN_LEVEL = 'Unknown';

/** Levels share a fixed palette: monochrome greys plus the red and green accents. */
const LEVEL_COLORS = ['#111111', '#DC2626', '#71717A', '#12B76A', '#A1A1AA', '#3F3F46'];
const UNKNOWN_LEVEL_COLOR = '#D4D4D8';

export function levelColor(level: string, levels: string[]): string {
  if (level === UNKNOWN_LEVEL) return UNKNOWN_LEVEL_COLOR;
  const index = levels.filter((l) => l !== UNKNOWN_LEVEL).indexOf(level);
  return LEVEL_COLORS[Math.max(index, 0) % LEVEL_COLORS.length];
}

export function levelOf(job: JobRecord): string {
  const level = job.payload?.job_level;
  return level && level !== '—' ? String(level) : UNKNOWN_LEVEL;
}

export function countLevels(jobs: JobRecord[]): LevelCounts {
  const counts: LevelCounts = {};
  for (const job of jobs) counts[levelOf(job)] = (counts[levelOf(job)] ?? 0) + 1;
  return counts;
}

function mostCommon(values: Iterable<string>): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function pushTo<K>(map: Map<K, JobRecord[]>, key: K, job: JobRecord) {
  const list = map.get(key);
  if (list) list.push(job);
  else map.set(key, [job]);
}

function postedDate(job: JobRecord): string | null {
  const date = job.payload?.date_posted;
  return date && date !== '—' ? String(date) : null;
}

/** Aggregates the loaded job listings into the figures shown on the dashboard. */
export function computeJobStats(jobs: JobRecord[]): JobStats {
  const byDate = new Map<string, JobRecord[]>();
  const byCompany = new Map<string, JobRecord[]>();

  for (const job of jobs) {
    const date = postedDate(job);
    if (date) pushTo(byDate, date, job);
    if (job.company_name) pushTo(byCompany, job.company_name, job);
  }

  const daily = [...byDate.entries()]
    .map(([date, list]) => ({
      date,
      count: list.length,
      topCompany: mostCommon(list.flatMap((j) => (j.company_name ? [j.company_name] : []))),
      levelCounts: countLevels(list),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topCompanies = [...byCompany.entries()]
    .map(([name, list]) => ({
      name,
      count: list.length,
      share: jobs.length ? list.length / jobs.length : 0,
      topLocation: mostCommon(list.flatMap((j) => (j.location ? [j.location] : []))),
      levelCounts: countLevels(list),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_COMPANY_LIMIT);

  const latest = daily.at(-1);

  return {
    total: jobs.length,
    uniqueCompanies: byCompany.size,
    avgPerCompany: byCompany.size ? jobs.length / byCompany.size : 0,
    latestDate: latest?.date ?? null,
    latestCount: latest?.count ?? 0,
    daily,
    topCompanies,
    topLocation: mostCommon(jobs.flatMap((j) => (j.location ? [j.location] : []))),
    levels: Object.entries(countLevels(jobs))
      .sort((a, b) => b[1] - a[1])
      .map(([level]) => level),
  };
}
