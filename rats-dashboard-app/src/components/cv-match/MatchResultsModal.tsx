'use client';
import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, ExternalLink, MapPin, X } from 'lucide-react';
import type { JobMatch } from '@/types/api';
import { freshnessInfo } from '@/lib/freshness';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Display scores at or above this read as a strong (green) match. */
const STRONG_MATCH = 0.9;
const noopSubscribe = () => () => {};

interface MatchResultsModalProps {
  isOpen: boolean;
  matches: JobMatch[];
  totalMatches: number;
  onClose: () => void;
}

/**
 * Ranked CV matches in a dialog, so the results never push the dashboard down. Rendered into
 * document.body to escape transformed ancestors; slides up as a bottom sheet on phones.
 */
export default function MatchResultsModal({
  isOpen,
  matches,
  totalMatches,
  onClose,
}: MatchResultsModalProps) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100001] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-results-title"
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
            <div className="flex items-start justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
              <div className="min-w-0">
                <p className="label-md text-gray-500">
                  RESULTS / {totalMatches} {totalMatches === 1 ? 'JOB' : 'JOBS'}
                </p>
                <h2
                  id="match-results-title"
                  className="font-display mt-1 text-xl leading-tight font-medium text-gray-900 sm:text-2xl"
                >
                  Your best matches
                </h2>
              </div>
              <button onClick={onClose} className="btn btn-icon" aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>

            <ol className="custom-scrollbar min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100">
              {matches.map((match, index) => {
                const fresh = freshnessInfo(
                  match.payload?.date_posted ? String(match.payload.date_posted) : null
                );
                const percent = Math.min(match.score * 100, 100);
                const strong = match.score >= STRONG_MATCH;

                return (
                  <li
                    key={match.job_snapshot_id ?? `match-${index}`}
                    className="flex gap-3 p-4 sm:gap-4 sm:px-6 sm:py-5"
                  >
                    <span className="label-md w-6 shrink-0 pt-1 text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 font-semibold text-gray-900">
                          {fresh.isEarlyBird && (
                            <span
                              className="bg-success-500 mr-2 inline-block h-2 w-2 animate-pulse align-middle"
                              title="Posted in the last few days"
                            />
                          )}
                          {match.job_title ?? 'Untitled position'}
                        </h3>
                        <span
                          className={`font-display shrink-0 text-2xl leading-none font-medium tabular-nums ${
                            strong ? 'text-success-700' : 'text-gray-900'
                          }`}
                        >
                          {percent.toFixed(0)}
                          <span className="text-sm text-gray-400">%</span>
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {match.company_name && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Building2 size={14} className="shrink-0" />
                            <span className="truncate">{match.company_name}</span>
                          </span>
                        )}
                        {match.location && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">{match.location}</span>
                          </span>
                        )}
                        <span className="label-md text-gray-400">{fresh.label}</span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden bg-gray-100">
                          <motion.div
                            className={`h-full ${strong ? 'bg-success-500' : 'bg-gray-900'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{
                              delay: 0.2 + index * 0.04,
                              duration: 0.8,
                              ease: EASE_OUT,
                            }}
                          />
                        </div>
                        {match.job_url && (
                          <a
                            href={match.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-accent label-md h-9 shrink-0 px-3"
                          >
                            Apply now
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
