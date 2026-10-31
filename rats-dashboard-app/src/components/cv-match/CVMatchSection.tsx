'use client';
import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { predictBestMatchJob } from '@/lib/api';
import { spreadScores } from '@/lib/freshness';
import type { JobMatch } from '@/types/api';
import CVUploadBar from '@/components/cv-match/CVUploadBar';
import MatchResultsModal from '@/components/cv-match/MatchResultsModal';

const TOP_K = 10;
/** A level filter is applied after the search, so it starts from a wider pool. */
const LEVEL_TOP_K = 25;

/** Levels that say nothing about seniority, so they are not offered as a match target. */
const UNSELECTABLE_LEVELS = new Set(['unknown', 'not applicable']);

interface CVMatchSectionProps {
  totalListings: number;
  totalCompanies: number;
  /** Every job level in the data; the user picks which ones to match against. */
  levels: string[];
}

/** Hero for the CV matcher: upload a CV, then rank the closest live listings. */
export default function CVMatchSection({
  totalListings,
  totalCompanies,
  levels,
}: CVMatchSectionProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const selectableLevels = levels.filter((level) => !UNSELECTABLE_LEVELS.has(level.toLowerCase()));

  const handleUpload = useCallback(
    async (file: File, levelToMatch: string | null = selectedLevel) => {
      setLastFile(file);
      setIsUploading(true);
      setError(null);
      try {
        const result = await predictBestMatchJob(
          file,
          levelToMatch ? LEVEL_TOP_K : TOP_K,
          undefined,
          levelToMatch ? [levelToMatch] : []
        );
        setMatches(spreadScores(result.matches));
        setTotalMatches(result.total_matches);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to match CV');
      } finally {
        setIsUploading(false);
      }
    },
    [selectedLevel]
  );

  const chooseLevel = (level: string | null) => {
    if (level === selectedLevel) return;
    setSelectedLevel(level);
    if (lastFile && !isUploading) handleUpload(lastFile, level);
  };

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <section aria-labelledby="cv-match-title" className="space-y-4">
      <div className="relative overflow-hidden border border-gray-200 bg-white p-5 sm:p-6 lg:p-8">
        <div aria-hidden="true" className="ambient-dither pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="ambient-glow bg-brand-500/10 pointer-events-none absolute -top-28 -right-20 h-72 w-72 blur-3xl"
        />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-10">
          <div>
            <p className="label-md flex flex-wrap items-center gap-2 text-gray-500">
              <span className="bg-success-500 h-2 w-2 animate-pulse" />
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
              We help you find the right jobs for you and apply as an early bird (within 7 days of
              the job post).
            </p>
          </div>

          <div className="space-y-3">
            <div
              role="radiogroup"
              aria-label="Job level to match"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="label-md mr-1 text-gray-500">MATCH LEVEL</span>
              {[null, ...selectableLevels].map((level) => {
                const active = level === selectedLevel;
                return (
                  <button
                    key={level ?? 'all'}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isUploading}
                    onClick={() => chooseLevel(level)}
                    className={`label-md h-7 border px-2 transition-colors duration-200 disabled:opacity-50 ${
                      active
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-900'
                    }`}
                  >
                    {level ?? 'All'}
                  </button>
                );
              })}
            </div>
            <CVUploadBar onUpload={handleUpload} isUploading={isUploading} />
            <div className="flex h-12 gap-2">
              {isUploading ? (
                <div className="skeleton h-full flex-1" aria-hidden="true" />
              ) : matches.length > 0 ? (
                <>
                  <motion.button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="btn-accent cta-pulse label-md group h-full min-w-0 flex-1 gap-2 px-4 motion-reduce:animate-none"
                  >
                    <Sparkles size={16} className="shrink-0" />
                    <span className="truncate">
                      View {totalMatches} matching {totalMatches === 1 ? 'job' : 'jobs'}
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </motion.button>
                  {lastFile && (
                    <button
                      type="button"
                      onClick={() => handleUpload(lastFile)}
                      className="btn h-full w-12 shrink-0 p-0"
                      aria-label="Match again"
                      title="Match again"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </>
              ) : (
                <p className="flex h-full flex-1 items-center justify-center border border-dashed border-gray-300 px-3 text-center text-xs text-gray-400">
                  {hasSearched && !error
                    ? 'No close matches. Try a more detailed CV.'
                    : 'Your matching jobs will show up here'}
                </p>
              )}
            </div>
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="border-brand-200 bg-brand-50 text-brand-700 flex items-start justify-between gap-3 border p-3 text-sm"
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

      <MatchResultsModal
        isOpen={isModalOpen}
        matches={matches}
        totalMatches={totalMatches}
        onClose={closeModal}
      />
    </section>
  );
}
