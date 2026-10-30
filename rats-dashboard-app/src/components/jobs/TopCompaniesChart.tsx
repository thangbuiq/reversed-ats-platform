'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { levelColor, type CompanyStat } from '@/lib/jobStats';
import { renderTooltip } from '@/lib/chartTooltip';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const CHART_HEIGHT = 300;

interface TopCompaniesChartProps {
  companies: CompanyStat[];
  /** Every level present, most frequent first; one stacked series and legend entry each. */
  levels: string[];
}

export default function TopCompaniesChart({ companies, levels }: TopCompaniesChartProps) {
  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    colors: levels.map((level) => levelColor(level, levels)),
    plotOptions: {
      bar: { horizontal: true, borderRadius: 3, borderRadiusWhenStacked: 'last', barHeight: '60%' },
    },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['#fff'] },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      markers: { size: 5, shape: 'circle', strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    xaxis: {
      categories: companies.map((c) => c.name),
      labels: { formatter: (val: string) => Math.round(Number(val)).toString() },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { maxWidth: 140 } },
    tooltip: {
      fixed: { enabled: true, position: 'bottomRight', offsetX: 0, offsetY: 0 },
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const company = companies[dataPointIndex];
        return renderTooltip(
          company.name,
          { label: 'open jobs', value: company.count.toLocaleString() },
          [
            ['Share of listings', `${(company.share * 100).toFixed(1)}%`],
            ['Main location', company.topLocation ?? 'N/A'],
          ],
          {
            title: 'By level',
            items: Object.entries(company.levelCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => ({ label, value, color: levelColor(label, levels) })),
          }
        );
      },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-400/20 dark:bg-gray-800">
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        Top Hiring Companies
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Open listings per company, split by level
      </p>
      <ReactApexChart
        options={options}
        series={levels.map((level) => ({
          name: level,
          data: companies.map((c) => c.levelCounts[level] ?? 0),
        }))}
        type="bar"
        height={CHART_HEIGHT}
      />
    </div>
  );
}
