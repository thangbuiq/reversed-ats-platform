'use client';
import React from 'react';
import { Briefcase, CalendarDays, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CountUp from '@/components/common/CountUp';
import type { JobStats } from '@/lib/jobStats';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  details: [label: string, value: string][];
  /** Shows a green dot next to the value when the figure is current. */
  live?: boolean;
}

function MetricCard({ label, value, icon, details, live }: MetricCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="lift-hover flex min-w-0 cursor-default flex-col gap-3 rounded-[9px] border border-gray-200 bg-white p-3 text-left sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-black text-white sm:h-10 sm:w-10">
              {icon}
            </div>
            <span className="label-md truncate text-gray-500">{label}</span>
          </div>
          <p className="font-display flex items-center gap-2 text-xl leading-none font-medium text-gray-900 sm:text-2xl">
            {live && (
              <span
                className="bg-success-500 h-2 w-2 shrink-0 animate-pulse rounded-full"
                aria-hidden="true"
              />
            )}
            {value}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="space-y-1 px-3 py-2">
        {details.map(([detailLabel, detailValue]) => (
          <div key={detailLabel} className="flex justify-between gap-6">
            <span className="opacity-70">{detailLabel}</span>
            <span className="font-mono font-semibold">{detailValue}</span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
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

export default function JobsMetrics({ stats }: { stats: JobStats }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
      <MetricCard
        label="Total Jobs"
        value={<CountUp value={stats.total} />}
        icon={<Briefcase size={18} strokeWidth={1.75} />}
        details={[
          ['Days with postings', stats.daily.length.toLocaleString()],
          ['Top location', stats.topLocation ?? 'N/A'],
        ]}
      />
      <MetricCard
        label="Latest"
        value={stats.latestDate ? shortDate(stats.latestDate) : 'N/A'}
        live={stats.latestDate ? daysSince(stats.latestDate) === 'Today' : false}
        icon={<CalendarDays size={18} strokeWidth={1.75} />}
        details={[
          ['Date', stats.latestDate ?? 'N/A'],
          ['Posted', stats.latestDate ? daysSince(stats.latestDate) : 'N/A'],
          ['Jobs that day', stats.latestCount.toLocaleString()],
        ]}
      />
      <MetricCard
        label="Companies"
        value={<CountUp value={stats.uniqueCompanies} />}
        icon={<Building2 size={18} strokeWidth={1.75} />}
        details={[
          ['Avg jobs per company', stats.avgPerCompany.toFixed(1)],
          ['Top hirer', stats.topCompanies[0]?.name ?? 'N/A'],
        ]}
      />
    </div>
  );
}
