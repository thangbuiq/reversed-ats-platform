'use client';
import React, { useState } from 'react';
import { predictBestMatchJob } from '@/lib/api';
import { spreadScores } from '@/lib/freshness';
import type { JobMatch } from '@/types/api';
import CVUploadCard from '@/components/cv-match/CVUploadCard';
import MatchResults from '@/components/cv-match/MatchResults';

export default function CVMatchPage() {
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
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">CV Matcher</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your CV and find the most relevant job openings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Upload card */}
        <div className="xl:col-span-5">
          <CVUploadCard onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Results */}
        <div className="xl:col-span-7">
          {error && (
            <div className="border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 mb-6 rounded-xl border p-4">
              <p className="font-medium">Matching Error</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {hasSearched && matches.length > 0 && (
            <MatchResults matches={matches} totalMatches={totalMatches} />
          )}

          {hasSearched && matches.length === 0 && !error && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                No matches found
              </h4>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try uploading a different CV or check that jobs are materialized
              </p>
            </div>
          )}

          {!hasSearched && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="bg-brand-50 dark:bg-brand-500/15 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <svg
                  className="text-brand-500 h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Ready to match
              </h4>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Upload your CV to discover the best matching job openings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
