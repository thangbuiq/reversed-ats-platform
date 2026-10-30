'use client';
import React from 'react';
import { Briefcase, CalendarDays, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { JobStats } from '@/lib/jobStats';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClassName?: string;
  details: [label: string, value: string][];
  /** Shows a green dot next to the value when the figure is current. */
  live?: boolean;
}

function MetricCard({ label, value, icon, iconClassName = '', details, live }: MetricCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-gray-400/20 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white transition hover:bg-gray-800 ${iconClassName}`}
              >
                {icon}
              </div>
              <span className="label-md text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <h4 className="font-display flex items-center gap-2 text-xl font-medium text-gray-800 dark:text-white/90">
              {live && (
                <span
                  className="bg-success-500 h-2 w-2 shrink-0 animate-pulse rounded-full"
                  aria-hidden="true"
                />
              )}
              {value}
            </h4>
          </div>
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

export default function JobsMetrics({ stats }: { stats: JobStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
      <MetricCard
        label="Total Jobs"
        value={stats.total.toLocaleString()}
        icon={<Briefcase className="text-white" size={20} strokeWidth={1.75} />}
        details={[
          ['Days with postings', stats.daily.length.toLocaleString()],
          ['Top location', stats.topLocation ?? 'N/A'],
        ]}
      />
      <MetricCard
        label="Latest Posting"
        value={stats.latestDate ?? 'N/A'}
        live={stats.latestDate ? daysSince(stats.latestDate) === 'Today' : false}
        icon={<CalendarDays className="text-white" size={20} strokeWidth={1.75} />}
        details={[
          ['Posted', stats.latestDate ? daysSince(stats.latestDate) : 'N/A'],
          ['Jobs that day', stats.latestCount.toLocaleString()],
        ]}
      />
      <MetricCard
        label="Unique Companies"
        value={stats.uniqueCompanies.toLocaleString()}
        icon={<Building2 className="text-white" size={20} strokeWidth={1.75} />}
        details={[
          ['Avg jobs per company', stats.avgPerCompany.toFixed(1)],
          ['Top hirer', stats.topCompanies[0]?.name ?? 'N/A'],
        ]}
      />
    </div>
  );
}
