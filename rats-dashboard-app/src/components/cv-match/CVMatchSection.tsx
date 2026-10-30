'use client';
import React, { useState } from 'react';
import { predictBestMatchJob } from '@/lib/api';
import { spreadScores } from '@/lib/freshness';
import type { JobMatch } from '@/types/api';
import { FileText } from 'lucide-react';
import CVUploadBar from '@/components/cv-match/CVUploadBar';
import MatchResults from '@/components/cv-match/MatchResults';

interface CVMatchSectionProps {
  totalListings: number;
  totalCompanies: number;
}

/** CV upload and best-match results, framed against the listings shown on the dashboard. */
export default function CVMatchSection({ totalListings, totalCompanies }: CVMatchSectionProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await predictBestMatchJob(file, 10);
      setMatches(spreadScores(result.matches));
      setTotalMatches(result.total_matches);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to match CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section aria-labelledby="cv-match-title" className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex items-center gap-3 lg:w-[34%] lg:shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white transition hover:bg-gray-800">
            <FileText className="text-white" size={20} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 id="cv-match-title" className="text-base font-semibold text-gray-800">
              Match your CV to this market
            </h2>
            <p className="text-xs text-gray-500">
              {totalListings.toLocaleString()} listings · {totalCompanies.toLocaleString()}{' '}
              companies
            </p>
          </div>
        </div>
        <div className="flex-1">
          <CVUploadBar onUpload={handleUpload} isUploading={isUploading} />
          {error && <p className="text-error-600 mt-2 text-xs">{error}</p>}
        </div>
      </div>

      {hasSearched && matches.length > 0 && (
        <MatchResults matches={matches} totalMatches={totalMatches} />
      )}
      {hasSearched && matches.length === 0 && !error && (
        <p className="px-1 text-sm text-gray-500">
          No matches found. Try a different CV or check that jobs are materialized.
        </p>
      )}
    </section>
  );
}
