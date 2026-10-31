'use client';
import React from 'react';
import { Briefcase, CalendarDays, Building2 } from 'lucide-react';
import CountUp from '@/components/common/CountUp';
import { EARLY_BIRD_DAYS } from '@/lib/freshness';
import type { JobStats } from '@/lib/jobStats';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  /** Main context line, always visible. */
  primary: string;
  /** Extra context, shown from the sm breakpoint up where there is room. */
  secondary?: string;
  /** Shows a green dot next to the value when the figure is current. */
  live?: boolean;
}

function MetricCard({ label, value, icon, primary, secondary, live }: MetricCardProps) {
  return (
    <div className="lift-hover flex min-w-0 flex-col gap-2 border border-gray-200 bg-white p-3 text-left sm:gap-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center bg-black text-white sm:flex">
          {icon}
        </div>
        <span className="label-md truncate text-gray-500">{label}</span>
      </div>
      <p className="font-display flex items-center gap-2 text-2xl leading-none font-medium text-gray-900 sm:text-3xl">
        {live && (
          <span className="bg-success-500 h-2 w-2 shrink-0 animate-pulse" aria-hidden="true" />
        )}
        {value}
      </p>
      <div className="min-w-0 space-y-0.5 text-xs text-gray-500">
        <p className="line-clamp-2 sm:truncate" title={primary}>
          {primary}
        </p>
        {secondary && (
          <p className="hidden truncate sm:block" title={secondary}>
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function daysSince(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return 'N/A';
  return days <= 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`;
}

function shortDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function plural(count: number, noun: string): string {
  return `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;
}

export default function JobsMetrics({ stats }: { stats: JobStats }) {
  const topHirer = stats.topCompanies[0];
  const latestAge = stats.latestDate ? daysSince(stats.latestDate) : null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
      <MetricCard
        label="Total Jobs"
        value={<CountUp value={stats.total} />}
        icon={<Briefcase size={16} strokeWidth={1.75} />}
        primary={`${stats.earlyBirds.toLocaleString()} early birds (≤${EARLY_BIRD_DAYS}d)`}
        secondary={stats.topLocation ? `Most in ${stats.topLocation}` : undefined}
      />
      <MetricCard
        label="Latest"
        value={stats.latestDate ? shortDate(stats.latestDate) : 'N/A'}
        live={latestAge === 'Today'}
        icon={<CalendarDays size={16} strokeWidth={1.75} />}
        primary={latestAge ? `${plural(stats.latestCount, 'job')} · ${latestAge}` : 'No dated jobs'}
        secondary={`Over ${plural(stats.daily.length, 'day')} of postings`}
      />
      <MetricCard
        label="Companies"
        value={<CountUp value={stats.uniqueCompanies} />}
        icon={<Building2 size={16} strokeWidth={1.75} />}
        primary={topHirer ? `Top: ${topHirer.name} (${topHirer.count})` : 'No companies'}
        secondary={`${stats.avgPerCompany.toFixed(1)} jobs per company`}
      />
    </div>
  );
}
