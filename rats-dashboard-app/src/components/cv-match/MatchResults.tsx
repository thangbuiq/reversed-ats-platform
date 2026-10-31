'use client';
import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ExternalLink, MapPin } from 'lucide-react';
import type { JobMatch } from '@/types/api';
import { freshnessInfo } from '@/lib/freshness';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Display scores at or above this read as a strong (green) match. */
const STRONG_MATCH = 0.9;

interface MatchResultsProps {
  matches: JobMatch[];
  totalMatches: number;
}

export default function MatchResults({ matches, totalMatches }: MatchResultsProps) {
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const closeModal = useCallback(() => setSelectedJob(null), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="overflow-hidden border border-gray-200 bg-white"
    >
      <div className="flex items-end justify-between gap-3 border-b border-gray-100 p-5 md:p-6">
        <div>
          <p className="label-md text-gray-500">RESULTS</p>
          <h3 className="font-display mt-1 text-xl font-medium text-gray-900">Your best matches</h3>
        </div>
        <span className="label-md bg-gray-100 px-3 py-1.5 text-gray-900">
          {totalMatches} {totalMatches === 1 ? 'JOB' : 'JOBS'}
        </span>
      </div>

      <ol className="divide-y divide-gray-100">
        {matches.map((match, index) => {
          const fresh = freshnessInfo(
            match.payload?.date_posted ? String(match.payload.date_posted) : null
          );
          const percent = Math.min(match.score * 100, 100);
          const strong = match.score >= STRONG_MATCH;

          return (
            <motion.li
              key={match.job_snapshot_id ?? `match-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.06, duration: 0.5, ease: EASE_OUT }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJob(match)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedJob(match);
                  }
                }}
                className="group flex cursor-pointer gap-3 p-4 transition-colors duration-200 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none sm:gap-5 sm:p-5 md:px-6"
              >
                <span className="label-md w-6 shrink-0 pt-1 text-gray-400 sm:w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="group-hover:text-brand-600 line-clamp-2 font-semibold text-gray-900 transition-colors">
                      {fresh.isEarlyBird && (
                        <span
                          className="bg-success-500 mr-2 inline-block h-2 w-2 animate-pulse align-middle"
                          title="Posted in the last few days"
                        />
                      )}
                      {match.job_title ?? 'Untitled position'}
                    </h4>
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
                        transition={{ delay: 0.2 + index * 0.06, duration: 0.9, ease: EASE_OUT }}
                      />
                    </div>
                    {match.job_url && (
                      <a
                        href={match.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn label-md h-9 shrink-0 px-3"
                      >
                        Apply
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <JobDetailsModal job={selectedJob} onClose={closeModal} />
    </motion.div>
  );
}
