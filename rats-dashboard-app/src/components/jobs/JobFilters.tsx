'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Minus, Search } from 'lucide-react';
import { useJobs } from '@/context/JobsContext';
import {
  DEFAULT_FILTERS,
  RANGE_OPTIONS,
  ROLE_KEYWORDS,
  facetOptions,
  keywordCounts,
  sameFilters,
  toggleValue,
} from '@/lib/jobFilters';
import { formatLevel } from '@/lib/jobStats';

type BoxState = 'checked' | 'mixed' | 'unchecked';

/** Square checkbox glyph: red when checked, red with a dash when only some are checked. */
function Box({ state }: { state: BoxState }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
        state === 'unchecked'
          ? 'border-gray-300 bg-white'
          : 'border-brand-500 bg-brand-500 text-white'
      }`}
    >
      {state === 'checked' && <Check size={12} strokeWidth={3} />}
      {state === 'mixed' && <Minus size={12} strokeWidth={3} />}
    </span>
  );
}

interface FacetListProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  /** Display text for an option; the raw value is still what gets filtered on. */
  formatOption?: (option: string) => string;
}

/** Multi-select checkbox list; selected values stay listed even if other filters hide them. */
function FacetList({ label, options, selected, onToggle, onClear, formatOption }: FacetListProps) {
  const shown = [...new Set([...options, ...selected])].sort();
  return (
    <fieldset className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <legend className="label-md float-left text-gray-500">
          {label}
          {selected.length > 0 && ` (${selected.length})`}
        </legend>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="label-md text-gray-500 transition-colors hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
      <ul className="clear-both max-h-48 overflow-y-auto">
        {shown.map((option) => {
          const checked = selected.includes(option);
          return (
            <li key={option}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggle(option)}
                className="flex w-full items-center gap-2 px-1 py-1.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100"
              >
                <Box state={checked ? 'checked' : 'unchecked'} />
                <span className="min-w-0 truncate" title={option}>
                  {formatOption ? formatOption(option) : option}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

interface CompanySlicerProps {
  options: string[];
  selected: string[];
  /** The user unticked "Select all": nothing is ticked, yet no company is filtered out. */
  cleared: boolean;
  onChange: (selected: string[], cleared: boolean) => void;
}

/** Power BI style slicer: a summary box that opens a panel with "Select all" above the company list. */
function CompanySlicer({ options, selected, cleared, onChange }: CompanySlicerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = [...new Set([...options, ...selected])].sort();
  const allChecked = selected.length === 0 && !cleared;
  const allState: BoxState = allChecked ? 'checked' : selected.length === 0 ? 'unchecked' : 'mixed';
  const summary =
    selected.length === 0
      ? 'All companies'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} companies`;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const toggleOne = (company: string) => {
    const base = allChecked ? shown : selected;
    const next = base.includes(company) ? base.filter((c) => c !== company) : [...base, company];
    if (next.length === shown.length) onChange([], false);
    else onChange(next, next.length === 0);
  };

  const rowClass =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span className="label-md mb-1 block text-gray-500">Companies</span>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between gap-2 border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:border-gray-900"
      >
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            role="checkbox"
            aria-checked={allState === 'mixed' ? 'mixed' : allChecked}
            onClick={() => onChange([], allChecked)}
            className={`${rowClass} border-b border-gray-200 font-medium`}
          >
            <Box state={allState} />
            Select all
          </button>
          <ul className="max-h-56 overflow-y-auto">
            {shown.map((company) => {
              const checked = allChecked || selected.includes(company);
              return (
                <li key={company}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleOne(company)}
                    className={rowClass}
                  >
                    <Box state={checked ? 'checked' : 'unchecked'} />
                    <span className="min-w-0 truncate" title={company}>
                      {company}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Dashboard-wide filters for the sidebar: every metric, chart and the job table read the result. */
export default function JobFilters() {
  const { jobs, filteredJobs, filters, setFilters } = useJobs();
  const [companiesCleared, setCompaniesCleared] = useState(false);
  const isFiltered = !sameFilters(filters, DEFAULT_FILTERS);
  const counts = keywordCounts(jobs, filters);

  return (
    <section aria-label="Filters" className="space-y-5 border-t border-gray-200 pt-5 pb-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-xs leading-[20px] text-gray-400 uppercase">Filters</h2>
          <p className="label-md truncate text-gray-500">
            {filteredJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs
          </p>
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setCompaniesCleared(false);
            }}
            className="btn label-md h-9 shrink-0 px-3"
          >
            Reset
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Date range"
        className="flex h-10 items-center gap-0.5 border border-gray-200 bg-white p-1"
      >
        {RANGE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.range === value}
            onClick={() => setFilters({ ...filters, range: value })}
            className={`label-md h-full flex-1 transition-colors duration-200 ${
              filters.range === value
                ? 'bg-brand-500 text-white'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Filter keywords…"
          aria-label="Filter keywords"
          className="focus:border-brand-400 focus:ring-brand-500/20 h-10 w-full border border-gray-200 bg-transparent py-2 pr-3 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-hidden focus:ring-inset"
        />
      </div>

      <fieldset className="min-w-0">
        <legend className="label-md mb-2 text-gray-500">
          AI &amp; Data roles{filters.keywords.length > 0 && ` (${filters.keywords.length})`}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_KEYWORDS.map((keyword) => {
            const active = filters.keywords.includes(keyword);
            return (
              <button
                key={keyword}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFilters({ ...filters, keywords: toggleValue(filters.keywords, keyword) })
                }
                className={`label-md inline-flex h-8 items-center gap-1.5 border px-2.5 transition-colors duration-200 ${
                  active
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-900'
                }`}
              >
                {keyword}
                <span className={active ? 'text-white/80' : 'text-gray-400'}>
                  {counts[keyword]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <FacetList
        label="Levels"
        formatOption={formatLevel}
        options={facetOptions(jobs, filters, 'level')}
        selected={filters.level}
        onToggle={(value) => setFilters({ ...filters, level: toggleValue(filters.level, value) })}
        onClear={() => setFilters({ ...filters, level: [] })}
      />
      <CompanySlicer
        options={facetOptions(jobs, filters, 'company')}
        selected={filters.company}
        cleared={companiesCleared}
        onChange={(company, cleared) => {
          setFilters({ ...filters, company });
          setCompaniesCleared(cleared);
        }}
      />
    </section>
  );
}
