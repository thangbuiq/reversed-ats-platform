import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import Badge from '@/components/ui/badge/Badge';
import { freshnessInfo } from '@/lib/freshness';

export interface JobDetailsModalProps {
  job: {
    job_title: string | null;
    company_name: string | null;
    location: string | null;
    job_url: string | null;
    payload: Record<string, unknown>;
  } | null;
  onClose: () => void;
}

export default function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (job) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [job, onClose]);

  if (!job) return null;

  const getPayloadField = (key: string): string => {
    const val = job.payload?.[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-[99999]" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="animate-in fade-in fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content Frame (Shadcn Radix Dialog alike) */}
      <div className="animate-in zoom-in-95 fade-in fixed top-[50%] left-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg sm:rounded-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="ring-offset-background absolute top-4 right-4 rounded-sm p-1 opacity-70 transition-opacity hover:bg-gray-100 hover:opacity-100 focus:ring-2 focus:outline-none disabled:pointer-events-none dark:hover:bg-gray-800"
          aria-label="Close dialog"
        >
          <svg
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col space-y-1.5 pr-8 text-center sm:text-left">
          <h2 className="text-xl leading-none font-semibold tracking-tight text-gray-900 dark:text-white">
            {job.job_title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {job.company_name}
            {job.location ? ` · ${job.location}` : ''}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {getPayloadField('job_level') !== '—' && (
              <Badge size="sm" color="info">
                {getPayloadField('job_level')}
              </Badge>
            )}
            {getPayloadField('job_type') !== '—' && (
              <Badge size="sm" color="light">
                {getPayloadField('job_type')}
              </Badge>
            )}
            {getPayloadField('date_posted') !== '—' &&
              (() => {
                const fi = freshnessInfo(getPayloadField('date_posted'));
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

        {/* Scrollable Body */}
        <div className="custom-scrollbar my-2 max-h-[60vh] overflow-y-auto pr-2">
          <div className="prose prose-sm dark:prose-invert max-w-none leading-8 text-gray-700 dark:text-gray-300 [&>h1]:mt-6 [&>h2]:mt-5 [&>h3]:mt-4 [&>li]:mb-2 [&>ol]:mb-4 [&>p]:mb-4 [&>ul]:mb-4">
            <Markdown>
              {getPayloadField('job_description') !== '—'
                ? getPayloadField('job_description')
                : '*No description available.*'}
            </Markdown>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse pt-2 sm:flex-row sm:justify-end sm:space-x-3">
          <button
            onClick={onClose}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 sm:mt-0 sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-500 hover:bg-brand-600 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors sm:w-auto"
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
  );
}
