'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { levelColor, type DailyStat } from '@/lib/jobStats';
import { renderTooltip, type Trend } from '@/lib/chartTooltip';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface JobPostingChartProps {
  /** Daily stats sorted by date ascending. */
  data: DailyStat[];
  /** Every level present, used to keep level colors consistent across charts. */
  levels: string[];
}

const TREND_WINDOW = 7;
const MAX_X_LABELS = 6;
const CHART_HEIGHT = 300;

function shortDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function describeChange(
  current: number,
  previous: number | undefined
): { text: string; trend?: Trend } {
  if (previous === undefined) return { text: 'First day' };
  const diff = current - previous;
  const trend: Trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  return { text: `${diff > 0 ? '+' : ''}${diff} vs previous day`, trend };
}

export default function JobPostingChart({ data, levels }: JobPostingChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const categories = data.map((d) => d.date);

  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      height: CHART_HEIGHT,
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#DC2626'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] },
    },
    markers: { size: 0, strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const day = data[dataPointIndex];
        const window = data.slice(
          Math.max(0, dataPointIndex - TREND_WINDOW + 1),
          dataPointIndex + 1
        );
        const average = window.reduce((sum, d) => sum + d.count, 0) / window.length;
        const change = describeChange(day.count, data[dataPointIndex - 1]?.count);
        return renderTooltip(
          day.date,
          { label: 'new jobs', value: day.count.toLocaleString() },
          [
            ['Change', change.text, change.trend],
            [`${window.length}-day average`, average.toFixed(1)],
            ['Share of range', `${((day.count / total) * 100).toFixed(1)}%`],
            ['Most active company', day.topCompany ?? 'N/A'],
          ],
          {
            title: 'By level',
            items: Object.entries(day.levelCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => ({ label, value, color: levelColor(label, levels) })),
          }
        );
      },
    },
    xaxis: {
      type: 'category',
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(Math.max(categories.length - 1, 1), MAX_X_LABELS),
      labels: {
        style: { fontSize: '12px' },
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: (value: string) => shortDate(value),
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px' },
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-400/20 dark:bg-gray-800">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Jobs Posted by Day
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total.toLocaleString()} new postings in {data.length} day{data.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={[{ name: 'Jobs Posted', data: data.map((d) => d.count) }]}
        type="area"
        height={CHART_HEIGHT}
      />
    </div>
  );
}
