'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchJobs } from '@/lib/api';
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
    <div className="reveal-stagger space-y-6">
      <h1 className="sr-only">Dashboard</h1>

      {error && (
        <div className="border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 rounded-xl border p-4">
          <p className="font-medium">Error loading jobs</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      <JobFilters
        jobs={jobs}
        filters={filters}
        defaults={DEFAULT_FILTERS}
        visibleCount={filteredJobs.length}
        onChange={setFilters}
      />

      {/* Metric cards */}
      <JobsMetrics stats={stats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          {stats.daily.length > 0 ? (
            <JobPostingChart data={stats.daily} levels={stats.levels} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-400/20 dark:bg-gray-800">
              <p className="text-gray-400 dark:text-gray-500">No chart data available</p>
            </div>
          )}
        </div>
        {stats.topCompanies.length > 0 && (
          <div className="min-w-0 xl:col-span-5">
            <TopCompaniesChart companies={stats.topCompanies} levels={stats.levels} />
          </div>
        )}
      </div>

      <CVMatchSection totalListings={allStats.total} totalCompanies={allStats.uniqueCompanies} />

      {/* Jobs Table */}
      <JobsTable
        jobs={filteredJobs}
        levels={stats.levels}
        isLoading={isLoading}
        hasActiveFilters={!sameFilters(filters, { ...DEFAULT_FILTERS, range: 'all' })}
      />
    </div>
  );
}
