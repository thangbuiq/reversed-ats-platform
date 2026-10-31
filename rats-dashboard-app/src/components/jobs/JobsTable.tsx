'use client';
import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import type { JobRecord } from '@/types/api';
import { fetchJobDetail } from '@/lib/api';
import { countLevels, levelOf } from '@/lib/jobStats';
import { freshnessInfo } from '@/lib/freshness';
import { LevelLabel, LevelLegend } from '@/components/jobs/LevelLabel';
import { ExternalLink, Loader2 } from 'lucide-react';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface JobsTableProps {
  /** Jobs already filtered and sorted by the dashboard filters. */
  jobs: JobRecord[];
  /** Every level present, most frequent first; drives the legend colors shared with the charts. */
  levels: string[];
  isLoading?: boolean;
  hasActiveFilters?: boolean;
}

export default function JobsTable({
  jobs,
  levels,
  isLoading = false,
  hasActiveFilters = false,
}: JobsTableProps) {
  const [selectedJob, setSelectedJob] = React.useState<JobRecord | null>(null);
  const [jobDetail, setJobDetail] = React.useState<JobRecord | null>(null);

  React.useEffect(() => {
    setJobDetail(null);
    if (!selectedJob) return;
    let cancelled = false;
    fetchJobDetail(selectedJob.point_id)
      .then((detail) => {
        if (!cancelled) setJobDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setJobDetail(selectedJob);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedJob]);

  const [renderLimit, setRenderLimit] = React.useState(50);

  const loadingMessages = React.useMemo(
    () => [
      'Updating the latest opportunities...',
      'Finding the best matches...',
      'Fetching early bird roles...',
      'Almost there, preparing your job list...',
    ],
    []
  );

  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0);

  React.useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages]);

  React.useEffect(() => {
    setRenderLimit(50);
  }, [jobs]);

  const levelCounts = React.useMemo(() => countLevels(jobs), [jobs]);

  const paginatedJobs = jobs.slice(0, renderLimit);

  const getPayloadField = (job: JobRecord, key: string): string => {
    const val = job.payload?.[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const formatDate = (raw: string): string => {
    if (raw === '—') return raw;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return raw;
    }
  };

  const closeModal = React.useCallback(() => setSelectedJob(null), []);

  return (
    <div className="overflow-hidden border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 md:p-6">
        <div>
          <p className="label-md text-gray-500">MARKET</p>
          <h3 className="font-display mt-1 text-xl font-medium text-gray-900">Job listings</h3>
          <p className="text-sm text-gray-500">{jobs.length.toLocaleString()} matching jobs</p>
        </div>
        <LevelLegend levels={levels} counts={levelCounts} />
      </div>

      {isLoading ? (
        <div className="px-5 py-20 text-center">
          <div className="flex flex-col items-center justify-center gap-6">
            <Loader2 className="text-brand-500 animate-spin" size={40} strokeWidth={1.5} />
            <div className="flex flex-col items-center gap-2">
              <p className="min-h-[28px] animate-pulse text-lg font-medium text-gray-800 dark:text-white/90">
                {loadingMessages[loadingMsgIdx]}
              </p>
              <p className="max-w-sm text-sm text-gray-400 dark:text-gray-500">
                Hold on tight! We are pulling the freshest and most suitable jobs just for you.
              </p>
            </div>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <p className="px-5 py-12 text-center text-gray-400">
          {hasActiveFilters
            ? 'No jobs match your filter.'
            : 'No jobs found. Try materializing jobs first.'}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 md:hidden">
            {paginatedJobs.map((job) => {
              const dateRaw = getPayloadField(job, 'date_posted');
              const fresh = freshnessInfo(dateRaw === '—' ? null : dateRaw);
              return (
                <li key={job.point_id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedJob(job)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedJob(job);
                    }}
                    className="flex items-start gap-3 p-4 transition-colors active:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {fresh.isEarlyBird && (
                          <span className="bg-success-500 mr-2 inline-block h-1.5 w-1.5 animate-pulse align-middle" />
                        )}
                        {job.job_title ?? '—'}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {job.company_name ?? '—'}
                        {job.location ? ` · ${job.location}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <LevelLabel level={levelOf(job)} levels={levels} />
                        <span
                          className={`label-md ${fresh.isEarlyBird ? 'text-success-700' : 'text-gray-400'}`}
                        >
                          {fresh.label}
                        </span>
                      </div>
                    </div>
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-icon"
                        aria-label={`Apply to ${job.job_title ?? 'this job'}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden max-w-full overflow-x-auto md:block">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100">
                  <TableRow>
                    {['Job Title', 'Company', 'Location', 'Posted', 'Freshness', 'Level', ''].map(
                      (header) => (
                        <TableCell
                          key={header || 'actions'}
                          isHeader
                          className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                        >
                          {header}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {paginatedJobs.map((job) => {
                    const dateRaw = getPayloadField(job, 'date_posted');
                    const fresh = freshnessInfo(dateRaw === '—' ? null : dateRaw);
                    return (
                      <TableRow
                        key={job.point_id}
                        className={`group hover:bg-brand-50/40 dark:hover:bg-brand-500/5 cursor-pointer transition-all duration-200`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            {fresh.isEarlyBird && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="bg-success-500 h-1.5 w-1.5 shrink-0 animate-pulse" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm">Apply fast for early birds</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span className="text-theme-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 max-w-[240px] truncate font-medium text-gray-800 transition-colors dark:text-white/90">
                              {job.job_title ?? '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-theme-sm max-w-[160px] truncate px-4 py-3 text-start text-gray-600 dark:text-gray-300">
                          {job.company_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-theme-xs max-w-[140px] truncate px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                          {job.location ?? '—'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {formatDate(dateRaw)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {fresh.isEarlyBird ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <Badge size="sm" color={fresh.color}>
                                    🐣 {fresh.label}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">Apply fast for early birds</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge size="sm" color={fresh.color}>
                              {fresh.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <LevelLabel level={levelOf(job)} levels={levels} />
                        </TableCell>
                        <TableCell
                          className="px-4 py-3 text-start"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          {job.job_url ? (
                            <a
                              href={job.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600 text-theme-xs inline-flex items-center gap-1 font-medium transition-colors"
                            >
                              Apply
                              <svg
                                className="h-3 w-3"
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
                          ) : (
                            <span className="text-theme-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {renderLimit < jobs.length && (
        <div className="flex justify-center border-t border-gray-100 p-4 sm:p-5">
          <button
            onClick={() => setRenderLimit((prev) => prev + 50)}
            className="btn btn-md h-11 w-full px-5 sm:w-auto"
          >
            Show more
          </button>
        </div>
      )}

      <JobDetailsModal
        job={jobDetail ?? selectedJob}
        onClose={closeModal}
        levels={levels}
        isLoadingDescription={selectedJob !== null && jobDetail === null}
      />
    </div>
  );
}
