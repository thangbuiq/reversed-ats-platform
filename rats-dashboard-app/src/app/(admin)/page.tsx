"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { fetchJobs } from "@/lib/api";
import type { JobRecord } from "@/types/api";
import JobsMetrics from "@/components/jobs/JobsMetrics";
import JobPostingChart from "@/components/jobs/JobPostingChart";
import RemoteJobsChart from "@/components/jobs/RemoteJobsChart";
import JobsTable from "@/components/jobs/JobsTable";

const PAGE_SIZE = 50;

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobRecord[]>([]);
  const [total, setTotal] = useState(0);
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
        const data = await fetchJobs(PAGE_SIZE * 4, offset);
        allJobs = allJobs.concat(data.jobs);
        offset = data.next_offset;
        if (!offset) {
          hasMore = false;
        }
        iterations++;
      }

      setJobs(allJobs);
      setFilteredJobs(allJobs);
      setTotal(allJobs.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ---- Derived metrics ----
  const latestDate = useMemo(() => {
    for (const job of filteredJobs) {
      const d = job.payload?.date_posted;
      if (d && d !== "—") return String(d);
    }
    return null;
  }, [filteredJobs]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    for (const job of filteredJobs) {
      if (job.company_name) set.add(job.company_name);
    }
    return set.size;
  }, [filteredJobs]);

  // ---- Chart data: count jobs by date_posted ----
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of filteredJobs) {
      const d = job.payload?.date_posted;
      if (d && d !== "—") {
        const date = String(d);
        counts[date] = (counts[date] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredJobs]);

  // ---- Remote vs on-site ----
  const remoteStats = useMemo(() => {
    let remote = 0;
    let onsite = 0;
    for (const job of filteredJobs) {
      const isRemote = job.payload?.is_remote;
      if (isRemote === true || isRemote === "true") remote++;
      else onsite++;
    }
    return { remote, onsite };
  }, [filteredJobs]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of scraped LinkedIn job listings
          </p>
        </div>
        <Link
          href="/cv-match"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          CV Matcher
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <p className="font-medium">Error loading jobs</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Metric cards */}
      <JobsMetrics
        totalJobs={filteredJobs.length}
        latestDate={latestDate}
        topCompanies={uniqueCompanies}
      />

      {/* Charts row: line chart + donut chart side-by-side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {chartData.length > 0 ? (
            <JobPostingChart data={chartData} />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03] h-full flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500">No chart data available</p>
            </div>
          )}
        </div>
        <div className="xl:col-span-4">
          <RemoteJobsChart
            remoteCount={remoteStats.remote}
            onsiteCount={remoteStats.onsite}
          />
        </div>
      </div>

      {/* Jobs Table */}
      <JobsTable
        jobs={jobs}
        total={total}
        isLoading={isLoading}
        onFilterChange={setFilteredJobs}
      />
    </div>
  );
}
