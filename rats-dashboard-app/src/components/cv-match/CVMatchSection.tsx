'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { predictBestMatchJob } from '@/lib/api';
import { spreadScores } from '@/lib/freshness';
import type { JobMatch } from '@/types/api';
import CVUploadBar from '@/components/cv-match/CVUploadBar';
import MatchResults from '@/components/cv-match/MatchResults';

const TOP_K = 10;
const SKELETON_ROWS = 4;

interface CVMatchSectionProps {
  totalListings: number;
  totalCompanies: number;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4 rounded-[9px] border border-gray-200 bg-white p-5 md:p-6">
      <div className="skeleton h-5 w-40 rounded" />
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-gray-100 pt-4">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="skeleton h-8 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Hero for the CV matcher: upload a CV, then rank the closest live listings. */
export default function CVMatchSection({ totalListings, totalCompanies }: CVMatchSectionProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setLastFile(file);
    setIsUploading(true);
    setError(null);
    try {
      const result = await predictBestMatchJob(file, TOP_K);
      setMatches(spreadScores(result.matches));
      setTotalMatches(result.total_matches);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to match CV');
    } finally {
      setIsUploading(false);
    }
  }, []);

  useEffect(() => {
    if (isUploading || hasSearched) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isUploading, hasSearched, matches]);

  return (
    <section aria-labelledby="cv-match-title" className="space-y-4">
      <div className="relative overflow-hidden rounded-[9px] border border-gray-200 bg-white p-5 sm:p-6 lg:p-8">
        <div aria-hidden="true" className="ambient-dither pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="ambient-glow bg-brand-500/10 pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full blur-3xl"
        />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-10">
          <div>
            <p className="label-md flex flex-wrap items-center gap-2 text-gray-500">
              <span className="bg-success-500 h-2 w-2 animate-pulse rounded-full" />
              CV MATCH
              <span className="text-gray-300">/</span>
              {totalListings.toLocaleString()} LISTINGS
              <span className="text-gray-300">/</span>
              {totalCompanies.toLocaleString()} COMPANIES
            </p>
            <h2
              id="cv-match-title"
              className="font-display mask-reveal mt-3 text-[34px] leading-[1.04] font-medium tracking-tight text-gray-900 sm:text-5xl"
            >
              Find the jobs your CV <span className="text-brand-500">already fits</span>.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Upload your CV and we rank the closest live listings by meaning, not keywords.
            </p>
          </div>

          <div className="space-y-3">
            <CVUploadBar onUpload={handleUpload} isUploading={isUploading} />
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="border-brand-200 bg-brand-50 text-brand-700 flex items-start justify-between gap-3 rounded-[10px] border p-3 text-sm"
                >
                  <span>{error}</span>
                  {lastFile && (
                    <button
                      type="button"
                      onClick={() => handleUpload(lastFile)}
                      className="btn label-md h-8 shrink-0 px-3"
                    >
                      <RotateCcw size={12} />
                      Retry
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div ref={resultsRef} className="scroll-mt-24">
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsSkeleton />
            </motion.div>
          ) : hasSearched && matches.length > 0 ? (
            <MatchResults key="results" matches={matches} totalMatches={totalMatches} />
          ) : hasSearched && !error ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[9px] border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500"
            >
              No close matches yet. Try a more detailed CV or check back after the next crawl.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
