'use client';
import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Markdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';
import { freshnessInfo } from '@/lib/freshness';
import EarlyBirdMark from '@/components/jobs/EarlyBirdMark';
import { LevelLabel } from '@/components/jobs/LevelLabel';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const noopSubscribe = () => () => {};

export interface JobDetailsModalProps {
  job: {
    job_title: string | null;
    company_name: string | null;
    location: string | null;
    job_url: string | null;
    payload: Record<string, unknown>;
  } | null;
  onClose: () => void;
  /** True while the full description is still being fetched. */
  isLoadingDescription?: boolean;
}

function payloadField(payload: Record<string, unknown> | undefined, key: string): string | null {
  const val = payload?.[key];
  return val === null || val === undefined || val === '' || val === '—' ? null : String(val);
}

/**
 * Job details dialog. Rendered into document.body so transformed ancestors (reveal animations)
 * cannot trap its fixed positioning; slides up as a bottom sheet on phones.
 */
export default function JobDetailsModal({
  job,
  onClose,
  isLoadingDescription = false,
}: JobDetailsModalProps) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!job) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [job, onClose]);

  if (!isClient) return null;

  const level = payloadField(job?.payload, 'job_level');
  const jobType = payloadField(job?.payload, 'job_type');
  const datePosted = payloadField(job?.payload, 'date_posted');
  const description = payloadField(job?.payload, 'job_description');
  const fresh = datePosted ? freshnessInfo(datePosted) : null;

  return createPortal(
    <AnimatePresence>
      {job && (
        <div
          className="fixed inset-0 z-[100001] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-details-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="relative flex max-h-[88dvh] w-full max-w-2xl flex-col border border-gray-200 bg-white shadow-2xl sm:max-h-[85vh]"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 bg-gray-200 sm:hidden" />
            <div className="flex items-start gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
              <div className="min-w-0 flex-1">
                <h2
                  id="job-details-title"
                  className="font-display text-xl leading-tight font-medium text-gray-900 sm:text-2xl"
                >
                  {job.job_title ?? 'Untitled position'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {job.company_name}
                  {job.location ? ` · ${job.location}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {level && <LevelLabel level={level} />}
                  {jobType && (
                    <Badge size="sm" color="light">
                      {jobType}
                    </Badge>
                  )}
                  {fresh && (
                    <Badge size="sm" color={fresh.isEarlyBird ? 'success' : 'light'}>
                      {fresh.isEarlyBird && <EarlyBirdMark className="mr-1.5" />}
                      {fresh.label}
                    </Badge>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="btn btn-icon" aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-gray-100 px-5 py-4 sm:px-6">
              {isLoadingDescription ? (
                <div className="space-y-3">
                  {['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-2/3'].map((width, i) => (
                    <div key={i} className={`skeleton h-3.5 ${width}`} />
                  ))}
                </div>
              ) : (
                <div className="max-w-none text-sm leading-relaxed text-gray-700 [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:font-semibold [&_h1]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-gray-900 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
                  <Markdown>{description ?? '*No description available.*'}</Markdown>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-6">
              <button onClick={onClose} className="btn btn-md h-11 flex-1 sm:h-auto sm:flex-none">
                Close
              </button>
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent btn-md h-11 flex-1 sm:h-auto sm:flex-none"
                >
                  Apply now
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
