import type { JobRecord } from '@/types/api';
import { EARLY_BIRD_DAYS, daysSincePosted } from '@/lib/freshness';

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
  /** Jobs posted within the early bird window. */
  earlyBirds: number;
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

/** Every known level keeps its own color on every chart and filter state. */
const LEVEL_COLORS: Record<string, string> = {
  'mid-senior level': '#111111',
  'entry level': '#DC2626',
  associate: '#12B76A',
  internship: '#A1A1AA',
  'not applicable': '#E4E4E7',
  [UNKNOWN_LEVEL.toLowerCase()]: '#D4D4D8',
};
/** Levels LinkedIn adds later get a stable grey picked from their name. */
const FALLBACK_LEVEL_COLORS = ['#3F3F46', '#52525B', '#71717A', '#8E8E96'];

export function levelColor(level: string): string {
  const name = level.toLowerCase();
  if (name in LEVEL_COLORS) return LEVEL_COLORS[name];
  const hash = [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
  return FALLBACK_LEVEL_COLORS[hash % FALLBACK_LEVEL_COLORS.length];
}

/** Display name for a level: no "level" suffix, each word capitalized ("mid-senior level" -> "Mid-Senior"). */
export function formatLevel(level: string): string {
  return level
    .replace(/\s+level$/i, '')
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, boundary: string, letter: string) => boundary + letter.toUpperCase()
    );
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
    earlyBirds: jobs.filter((j) => daysSincePosted(postedDate(j)) <= EARLY_BIRD_DAYS).length,
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
