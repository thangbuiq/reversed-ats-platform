'use client';
import React, { useState } from 'react';
import Badge from '@/components/ui/badge/Badge';
import type { JobMatch } from '@/types/api';
import { freshnessInfo } from '@/lib/freshness';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';

interface MatchResultsProps {
  matches: JobMatch[];
  totalMatches: number;
}

function scoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 0.7) return 'success';
  if (score >= 0.4) return 'warning';
  return 'error';
}

export default function MatchResults({ matches, totalMatches }: MatchResultsProps) {
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 p-5 md:p-6 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Matched Jobs</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalMatches} matching {totalMatches === 1 ? 'job' : 'jobs'} found
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {matches.map((match, index) => {
          const dateRaw = match.payload?.date_posted ? String(match.payload.date_posted) : null;
          const fresh = freshnessInfo(dateRaw);

          return (
            <div
              key={match.job_snapshot_id ?? `match-${index}`}
              onClick={() => setSelectedJob(match)}
              className={`group cursor-pointer p-5 transition-colors hover:bg-gray-50 md:p-6 dark:hover:bg-white/[0.02] ${fresh.isEarlyBird ? 'early-bird-row' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    {fresh.isEarlyBird && (
                      <span
                        className="bg-success-500 h-2 w-2 shrink-0 animate-pulse rounded-full"
                        title="Apply fast for early birds"
                      />
                    )}
                    <h4 className="group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate font-semibold text-gray-800 transition-colors dark:text-white/90">
                      {match.job_title ?? 'Untitled Position'}
                    </h4>
                    <Badge size="sm" color={scoreColor(match.score)} variant="solid">
                      {(match.score * 100).toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {match.company_name && (
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                          />
                        </svg>
                        {match.company_name}
                      </span>
                    )}
                    {match.location && (
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
                          />
                        </svg>
                        {match.location}
                      </span>
                    )}
                  </div>
                </div>

                {match.job_url && (
                  <a
                    href={match.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  >
                    Apply
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>

              {/* Score bar */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Match Score</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {(match.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      match.score >= 0.7
                        ? 'bg-success-500'
                        : match.score >= 0.4
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    }`}
                    style={{ width: `${Math.min(match.score * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <JobDetailsModal job={selectedJob as any} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
