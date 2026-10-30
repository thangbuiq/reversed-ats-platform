'use client';
import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { JobRecord } from '@/types/api';
import {
  RANGE_OPTIONS,
  facetOptions,
  sameFilters,
  type JobFilters as JobFiltersState,
} from '@/lib/jobFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select/Select';

interface JobFiltersProps {
  jobs: JobRecord[];
  filters: JobFiltersState;
  defaults: JobFiltersState;
  visibleCount: number;
  onChange: (filters: JobFiltersState) => void;
}

const ALL = 'all';

interface FilterSelectProps {
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ value, allLabel, options, onChange }: FilterSelectProps) {
  return (
    <Select value={value || ALL} onValueChange={(val) => onChange(val === ALL ? '' : val)}>
      <SelectTrigger>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const truncate = (text: string) => (text.length > 30 ? `${text.substring(0, 30)}...` : text);

/** Dashboard-wide filters: every metric, chart and the job table reads the filtered jobs. */
export default function JobFilters({
  jobs,
  filters,
  defaults,
  visibleCount,
  onChange,
}: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isFiltered = !sameFilters(filters, defaults);
  const set = (patch: Partial<JobFiltersState>) => onChange({ ...filters, ...patch });
  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: truncate(v) }));

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="job-filters-body"
          onClick={() => setIsOpen((open) => !open)}
          className="btn label-md inline-flex items-center gap-2 px-3 py-1.5"
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          {isOpen ? 'Hide filters' : 'Show filters'}
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="flex items-center gap-3">
          <p className="label-md text-gray-500">
            {visibleCount.toLocaleString()} of {jobs.length.toLocaleString()} jobs
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange(defaults)}
              className="btn label-md px-3 py-1.5"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div id="job-filters-body" hidden={!isOpen} className="space-y-3">
        <div role="group" aria-label="Date range" className="flex flex-wrap gap-1">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.range === value}
              onClick={() => set({ range: value })}
              className={`label-md px-3 py-1.5 ${filters.range === value ? 'btn-accent' : 'btn'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            value={filters.company}
            allLabel="All companies"
            options={toOptions(facetOptions(jobs, filters, 'company'))}
            onChange={(company) => set({ company })}
          />
          <FilterSelect
            value={filters.level}
            allLabel="All levels"
            options={toOptions(facetOptions(jobs, filters, 'level'))}
            onChange={(level) => set({ level })}
          />
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="Filter keywords…"
              className="focus:border-brand-300 focus:ring-brand-500/10 h-10 w-full rounded-lg border border-gray-200 bg-transparent py-2 pr-3 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
