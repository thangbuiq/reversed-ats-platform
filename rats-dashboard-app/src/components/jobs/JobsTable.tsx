'use client';
import React from 'react';
import Markdown from 'react-markdown';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import type { JobRecord } from '@/types/api';
import { freshnessInfo } from '@/lib/freshness';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select/Select';

interface JobsTableProps {
  jobs: JobRecord[];
  total: number;
  isLoading?: boolean;
  onFilterChange?: (filteredJobs: JobRecord[]) => void;
}

export default function JobsTable({
  jobs,
  total,
  isLoading = false,
  onFilterChange,
}: JobsTableProps) {
  const [search, setSearch] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [companyFilter, setCompanyFilter] = React.useState('');
  const [levelFilter, setLevelFilter] = React.useState('');
  const [selectedJob, setSelectedJob] = React.useState<JobRecord | null>(null);

  const [renderLimit, setRenderLimit] = React.useState(50);

  const loadingMessages = React.useMemo(
    () => [
      'Personalizing jobs based on your profile...',
      'Updating the latest opportunities...',
      'Finding the best matches...',
      'Fetching early bird roles...',
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

  const [now] = React.useState(() => Date.now());

  const passesDate = React.useCallback(
    (j: JobRecord) => {
      let thresholdDays = 0;
      if (dateFilter === '24h') thresholdDays = 1;
      else if (dateFilter === '7d') thresholdDays = 7;
      else if (dateFilter === '30d') thresholdDays = 30;

      if (thresholdDays === 0) return true;
      const d = j.payload?.date_posted;
      if (!d || d === '—') return false;
      const diff = (now - new Date(String(d)).getTime()) / 86400000;
      return diff <= thresholdDays;
    },
    [dateFilter, now]
  );

  const passesSearch = React.useCallback(
    (j: JobRecord) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return Boolean(
        j.job_title?.toLowerCase().includes(q) ||
        j.company_name?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    },
    [search]
  );

  const uniqueCompanies = React.useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.company_name) {
        if (levelFilter && j.payload?.job_level !== levelFilter) return;
        if (!passesDate(j)) return;
        if (!passesSearch(j)) return;
        set.add(j.company_name);
      }
    });
    return Array.from(set).sort();
  }, [jobs, levelFilter, passesDate, passesSearch]);

  const uniqueLevels = React.useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      const l = j.payload?.job_level;
      if (l && typeof l === 'string' && l !== '—') {
        if (companyFilter && j.company_name !== companyFilter) return;
        if (!passesDate(j)) return;
        if (!passesSearch(j)) return;
        set.add(l);
      }
    });
    return Array.from(set).sort();
  }, [jobs, companyFilter, passesDate, passesSearch]);

  const sortedAndFiltered = React.useMemo(() => {
    let result = jobs.filter(
      (j) =>
        passesDate(j) &&
        (!companyFilter || j.company_name === companyFilter) &&
        (!levelFilter || j.payload?.job_level === levelFilter) &&
        passesSearch(j)
    );

    result.sort((a, b) => {
      const da =
        a.payload?.date_posted && a.payload.date_posted !== '—'
          ? new Date(String(a.payload.date_posted)).getTime()
          : 0;
      const db =
        b.payload?.date_posted && b.payload.date_posted !== '—'
          ? new Date(String(b.payload.date_posted)).getTime()
          : 0;
      return db - da;
    });

    return result;
  }, [jobs, companyFilter, levelFilter, passesDate, passesSearch]);

  React.useEffect(() => {
    if (onFilterChange) onFilterChange(sortedAndFiltered);
  }, [sortedAndFiltered, onFilterChange]);

  React.useEffect(() => {
    setRenderLimit(50);
  }, [search, dateFilter, companyFilter, levelFilter]);

  const paginatedJobs = sortedAndFiltered.slice(0, renderLimit);

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
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:p-6 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Job Listings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sortedAndFiltered.length.toLocaleString()} matching jobs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={dateFilter || 'all'}
              onValueChange={(val) => setDateFilter(val === 'all' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="24h">Past 24 hours</SelectItem>
                <SelectItem value="7d">Past week</SelectItem>
                <SelectItem value="30d">Past month</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={companyFilter || 'all'}
              onValueChange={(val) => setCompanyFilter(val === 'all' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {uniqueCompanies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.substring(0, 30)}
                    {c.length > 30 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={levelFilter || 'all'}
              onValueChange={(val) => setLevelFilter(val === 'all' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {uniqueLevels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter keywords…"
                className="focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-10 w-full rounded-lg border border-gray-200 bg-transparent py-2 pr-3 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          </div>
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
                ) : sortedAndFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-400 dark:text-gray-500"
                    >
                      {search.trim()
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
                        className={`group hover:bg-brand-50/40 dark:hover:bg-brand-500/5 cursor-pointer transition-all duration-200 ${fresh.isEarlyBird ? 'early-bird-row' : ''}`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            {fresh.isEarlyBird && (
                              <span
                                className="bg-success-500 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
                                title="Apply fast for early birds"
                              />
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
                          <Badge
                            size="sm"
                            color={fresh.color}
                            title={fresh.isEarlyBird ? 'Apply fast for early birds' : undefined}
                          >
                            {fresh.isEarlyBird ? `🐣 ${fresh.label}` : fresh.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {getPayloadField(job, 'job_level') !== '—' ? (
                            <Badge size="sm" color="info">
                              {getPayloadField(job, 'job_level')}
                            </Badge>
                          ) : (
                            <span className="text-theme-xs text-gray-400">—</span>
                          )}
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
        {renderLimit < sortedAndFiltered.length && (
          <div className="flex justify-center border-t border-gray-100 p-5 dark:border-gray-800">
            <button
              onClick={() => setRenderLimit((prev) => prev + 50)}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* ── Shadcn-style Dialog ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-[99999]">
          {/* Overlay */}
          <div
            className="animate-in fade-in fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          />

          {/* Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              className="animate-in zoom-in-95 fade-in relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button – top right, inside card */}
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 z-10 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
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
                  {getPayloadField(selectedJob, 'job_level') !== '—' && (
                    <Badge size="sm" color="info">
                      {getPayloadField(selectedJob, 'job_level')}
                    </Badge>
                  )}
                  {getPayloadField(selectedJob, 'job_type') !== '—' && (
                    <Badge size="sm" color="light">
                      {getPayloadField(selectedJob, 'job_type')}
                    </Badge>
                  )}
                  {getPayloadField(selectedJob, 'date_posted') !== '—' &&
                    (() => {
                      const fi = freshnessInfo(getPayloadField(selectedJob, 'date_posted'));
                      return (
                        <Badge
                          size="sm"
                          color={fi.color}
                          title={fi.isEarlyBird ? 'Apply fast for early birds' : undefined}
                        >
                          {fi.isEarlyBird ? `🐣 ${fi.label}` : fi.label}
                        </Badge>
                      );
                    })()}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="max-h-[50vh] overflow-y-auto px-6 pb-2">
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 [&>h1]:mt-5 [&>h2]:mt-4 [&>h3]:mt-3 [&>li]:mb-1 [&>ol]:mb-3 [&>p]:mb-3 [&>ul]:mb-3">
                  <Markdown>
                    {getPayloadField(selectedJob, 'job_description') !== '—'
                      ? getPayloadField(selectedJob, 'job_description')
                      : '*No description available.*'}
                  </Markdown>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Close
                </button>
                {selectedJob.job_url && (
                  <a
                    href={selectedJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
