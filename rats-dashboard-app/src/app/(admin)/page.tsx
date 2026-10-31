'use client';
import React, { useMemo } from 'react';
import { MotionConfig } from 'framer-motion';
import Reveal from '@/components/common/Reveal';
import JobsMetrics from '@/components/jobs/JobsMetrics';
import JobPostingChart from '@/components/jobs/JobPostingChart';
import TopCompaniesChart from '@/components/jobs/TopCompaniesChart';
import ChartSkeleton from '@/components/jobs/ChartSkeleton';
import { computeJobStats } from '@/lib/jobStats';
import CVMatchSection from '@/components/cv-match/CVMatchSection';
import JobsTable from '@/components/jobs/JobsTable';
import { useJobs } from '@/context/JobsContext';
import { DEFAULT_FILTERS, sameFilters } from '@/lib/jobFilters';

export default function DashboardPage() {
  const { jobs, filteredJobs, filters, isLoading, error } = useJobs();

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
            levels={allStats.levels}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <JobsMetrics stats={stats} />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
          <Reveal className="min-w-0 xl:col-span-7">
            {isLoading ? (
              <ChartSkeleton
                variant="line"
                title="Jobs Posted by Day"
                description="Loading postings…"
              />
            ) : stats.daily.length > 0 ? (
              <JobPostingChart data={stats.daily} />
            ) : (
              <div className="flex h-full min-h-60 items-center justify-center border border-gray-200 bg-white p-10 text-center">
                <p className="text-gray-400">No chart data available</p>
              </div>
            )}
          </Reveal>
          {(isLoading || stats.topCompanies.length > 0) && (
            <Reveal className="min-w-0 xl:col-span-5" delay={0.1}>
              {isLoading ? (
                <ChartSkeleton
                  variant="bar"
                  title="Top Hiring Companies"
                  description="Loading companies…"
                />
              ) : (
                <TopCompaniesChart companies={stats.topCompanies} levels={stats.levels} />
              )}
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
