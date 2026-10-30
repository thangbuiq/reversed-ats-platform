'use client';
import React from 'react';
import Markdown from 'react-markdown';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import type { JobRecord } from '@/types/api';
import { fetchJobDetail } from '@/lib/api';
import { countLevels, levelOf } from '@/lib/jobStats';
import { freshnessInfo } from '@/lib/freshness';
import { LevelLabel, LevelLegend } from '@/components/jobs/LevelLabel';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Close modal on Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedJob(null);
    };
    if (selectedJob) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [selectedJob]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-200 bg-white dark:border-gray-400/20 dark:bg-gray-800"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:p-6 dark:border-gray-400/20">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Job Listings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {jobs.length.toLocaleString()} matching jobs
            </p>
          </div>
          <LevelLegend levels={levels} counts={levelCounts} />
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
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

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative flex items-center justify-center">
                          <div className="border-brand-500 absolute inset-0 animate-[spin_1s_linear_infinite] rounded-full border-t-2" />
                          <div className="border-brand-400 absolute inset-2 animate-[spin_1.5s_linear_infinite] rounded-full border-r-2" />
                          <div className="border-brand-300 absolute inset-4 animate-[spin_2s_linear_infinite] rounded-full border-b-2" />
                          <svg
                            className="text-brand-100 dark:text-brand-900/50 h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <p className="min-h-[28px] animate-pulse text-lg font-medium text-gray-800 dark:text-white/90">
                            {loadingMessages[loadingMsgIdx]}
                          </p>
                          <p className="max-w-sm text-sm text-gray-400 dark:text-gray-500">
                            Hold on tight! We are pulling the freshest and most suitable jobs just
                            for you.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-400 dark:text-gray-500"
                    >
                      {hasActiveFilters
                        ? 'No jobs match your filter.'
                        : 'No jobs found. Try materializing jobs first.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedJobs.map((job) => {
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
                                  <span className="bg-success-500 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" />
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {renderLimit < jobs.length && (
          <div className="flex justify-center border-t border-gray-100 p-5 dark:border-gray-400/20">
            <button onClick={() => setRenderLimit((prev) => prev + 50)} className="btn btn-md px-5">
              Show More
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Shadcn-style Dialog ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100001]">
          {/* Overlay */}
          <div
            className="animate-in fade-in fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          />

          {/* Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button – top right, inside card */}
              <button
                onClick={() => setSelectedJob(null)}
                className="btn absolute top-4 right-4 z-10 size-8 p-0"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="p-6 pr-12 pb-4">
                <h2 className="text-lg leading-tight font-semibold text-gray-900 dark:text-white">
                  {selectedJob.job_title}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedJob.company_name}
                  {selectedJob.location ? ` · ${selectedJob.location}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LevelLabel level={levelOf(selectedJob)} levels={levels} />
                  {getPayloadField(selectedJob, 'job_type') !== '—' && (
                    <Badge size="sm" color="light">
                      {getPayloadField(selectedJob, 'job_type')}
                    </Badge>
                  )}
                  {getPayloadField(selectedJob, 'date_posted') !== '—' &&
                    (() => {
                      const fi = freshnessInfo(getPayloadField(selectedJob, 'date_posted'));
                      return fi.isEarlyBird ? (
                        <Tooltip key="earlybird-badge">
                          <TooltipTrigger asChild>
                            <div className="inline-block">
                              <Badge size="sm" color={fi.color}>
                                🐣 {fi.label}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Apply fast for early birds</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge key="date-badge" size="sm" color={fi.color}>
                          {fi.label}
                        </Badge>
                      );
                    })()}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="max-h-[50vh] overflow-y-auto px-6 pb-2">
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 [&>h1]:mt-5 [&>h2]:mt-4 [&>h3]:mt-3 [&>li]:mb-1 [&>ol]:mb-3 [&>p]:mb-3 [&>ul]:mb-3">
                  <Markdown>
                    {jobDetail === null
                      ? '*Loading description...*'
                      : getPayloadField(jobDetail, 'job_description') !== '—'
                        ? getPayloadField(jobDetail, 'job_description')
                        : '*No description available.*'}
                  </Markdown>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-400/20">
                <button onClick={() => setSelectedJob(null)} className="btn btn-md">
                  Close
                </button>
                {selectedJob.job_url && (
                  <a
                    href={selectedJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent btn-md"
                  >
                    Apply Now
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
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}
