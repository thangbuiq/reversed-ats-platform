'use client';
import React, { useState, useSyncExternalStore } from 'react';
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
const PHONE_QUERY = '(max-width: 767px)';

function subscribeToPhoneQuery(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Filters start collapsed on phones so the CV matcher and metrics stay above the fold. */
function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribeToPhoneQuery,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
}

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
  const isPhone = useIsPhone();
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const isOpen = openOverride ?? !isPhone;
  const isFiltered = !sameFilters(filters, defaults);
  const set = (patch: Partial<JobFiltersState>) => onChange({ ...filters, ...patch });
  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: truncate(v) }));

  return (
    <div className="rounded-[9px] border border-gray-200 bg-white p-3 sm:p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="job-filters-body"
          onClick={() => setOpenOverride(!isOpen)}
          className="btn label-md h-9 gap-2 px-3"
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          {isOpen ? 'Hide filters' : 'Filters'}
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <p className="label-md truncate text-gray-500">
            {visibleCount.toLocaleString()} of {jobs.length.toLocaleString()} jobs
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange(defaults)}
              className="btn label-md h-9 shrink-0 px-3"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div
        id="job-filters-body"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="-m-1 min-h-0 space-y-3 overflow-hidden p-1">
          <div
            role="group"
            aria-label="Date range"
            className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1"
          >
            {RANGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.range === value}
                onClick={() => set({ range: value })}
                className={`label-md h-9 shrink-0 px-4 ${filters.range === value ? 'btn-accent' : 'btn'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
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
            <div className="relative col-span-2 lg:col-span-1">
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
    </div>
  );
}
