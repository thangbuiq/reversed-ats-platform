'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchJobs } from '@/lib/api';
import { DEFAULT_FILTERS, filterJobs, type JobFilters } from '@/lib/jobFilters';
import type { JobRecord } from '@/types/api';

const FETCH_PAGE_SIZE = 1000;
const MAX_FETCH_PAGES = 20;

type JobsContextType = {
  jobs: JobRecord[];
  filteredJobs: JobRecord[];
  filters: JobFilters;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: JobFilters) => void;
};

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};

/** Owns the job list and the dashboard filters so the sidebar and the page share them. */
export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let offset: string | null = null;
      let allJobs: JobRecord[] = [];

      for (let page = 0; page < MAX_FETCH_PAGES; page++) {
        const data = await fetchJobs(FETCH_PAGE_SIZE, offset);
        allJobs = allJobs.concat(data.jobs);
        offset = data.next_offset;
        if (!offset) break;
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

  return (
    <JobsContext.Provider value={{ jobs, filteredJobs, filters, isLoading, error, setFilters }}>
      {children}
    </JobsContext.Provider>
  );
};
