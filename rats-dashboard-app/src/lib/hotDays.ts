import type { DailyStat } from '@/lib/jobStats';

export interface HotDay {
  date: string;
  count: number;
  /** How many times a typical day's posting volume this day reached. */
  ratio: number;
}

const MIN_DAYS = 7;
const MIN_HOT_COUNT = 5;
const MAD_TO_SIGMA = 1.4826;
const SIGMA_THRESHOLD = 3;
const MIN_RATIO = 2;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Days whose posting volume is abnormally high.
 *
 * Uses the median and median absolute deviation, so the spike itself does not inflate the baseline
 * the way a mean and standard deviation would.
 */
export function findHotDays(daily: DailyStat[]): HotDay[] {
  if (daily.length < MIN_DAYS) return [];
  const counts = daily.map((d) => d.count);
  const typical = median(counts);
  const spread = Math.max(MAD_TO_SIGMA * median(counts.map((c) => Math.abs(c - typical))), 1);
  const threshold = Math.max(
    typical + SIGMA_THRESHOLD * spread,
    typical * MIN_RATIO,
    MIN_HOT_COUNT
  );

  return daily
    .filter((d) => d.count >= threshold)
    .map((d) => ({ date: d.date, count: d.count, ratio: typical ? d.count / typical : d.count }));
}

/** Typical (median) daily posting volume, used to explain how hot a day is. */
export function typicalDailyCount(daily: DailyStat[]): number {
  return daily.length ? median(daily.map((d) => d.count)) : 0;
}
