'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MotionConfig } from 'framer-motion';
import { fetchJobs } from '@/lib/api';
import Reveal from '@/components/common/Reveal';
import type { JobRecord } from '@/types/api';
import JobsMetrics from '@/components/jobs/JobsMetrics';
import JobPostingChart from '@/components/jobs/JobPostingChart';
import TopCompaniesChart from '@/components/jobs/TopCompaniesChart';
import { computeJobStats } from '@/lib/jobStats';
import CVMatchSection from '@/components/cv-match/CVMatchSection';
import JobsTable from '@/components/jobs/JobsTable';
import JobFilters from '@/components/jobs/JobFilters';
import {
  DEFAULT_FILTERS,
  filterJobs,
  sameFilters,
  type JobFilters as JobFiltersState,
} from '@/lib/jobFilters';

const FETCH_PAGE_SIZE = 1000;

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [filters, setFilters] = useState<JobFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let offset: string | null = null;
      let allJobs: JobRecord[] = [];
      let hasMore = true;
      let iterations = 0;

      while (hasMore && iterations < 20) {
        const data = await fetchJobs(FETCH_PAGE_SIZE, offset);
        allJobs = allJobs.concat(data.jobs);
        offset = data.next_offset;
        if (!offset) {
          hasMore = false;
        }
        iterations++;
      }

      setJobs(allJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const stats = useMemo(() => computeJobStats(filteredJobs), [filteredJobs]);
  const allStats = useMemo(() => computeJobStats(jobs), [jobs]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4 sm:space-y-6">
        <h1 className="sr-only">Dashboard</h1>

        {error && (
          <div className="border-brand-200 bg-brand-50 text-brand-700 border p-4">
            <p className="font-medium">Error loading jobs</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <Reveal>
          <CVMatchSection
            totalListings={allStats.total}
            totalCompanies={allStats.uniqueCompanies}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <JobFilters
            jobs={jobs}
            filters={filters}
            defaults={DEFAULT_FILTERS}
            visibleCount={filteredJobs.length}
            onChange={setFilters}
          />
        </Reveal>

        <Reveal delay={0.16}>
          <JobsMetrics stats={stats} />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
          <Reveal className="min-w-0 xl:col-span-7">
            {stats.daily.length > 0 ? (
              <JobPostingChart data={stats.daily} levels={stats.levels} />
            ) : (
              <div className="flex h-full min-h-60 items-center justify-center border border-gray-200 bg-white p-10 text-center">
                <p className="text-gray-400">
                  {isLoading ? 'Loading chart…' : 'No chart data available'}
                </p>
              </div>
            )}
          </Reveal>
          {stats.topCompanies.length > 0 && (
            <Reveal className="min-w-0 xl:col-span-5" delay={0.1}>
              <TopCompaniesChart companies={stats.topCompanies} levels={stats.levels} />
            </Reveal>
          )}
        </div>

        <Reveal>
          <JobsTable
            jobs={filteredJobs}
            levels={stats.levels}
            isLoading={isLoading}
            hasActiveFilters={!sameFilters(filters, { ...DEFAULT_FILTERS, range: 'all' })}
          />
        </Reveal>
      </div>
    </MotionConfig>
  );
}
