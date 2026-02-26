'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface JobPostingChartProps {
  /** Array of { date: string; count: number } sorted by date ascending. */
  data: { date: string; count: number }[];
}

export default function JobPostingChart({ data }: JobPostingChartProps) {
  const categories = data.map((d) => d.date);
  const series = [{ name: 'Jobs Posted', data: data.map((d) => d.count) }];

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Outfit, sans-serif',
      height: 240,
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#465FFF'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      borderColor: '#e5e7eb',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' },
      x: { format: 'dd MMM yyyy' },
    },
    xaxis: {
      type: 'category',
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '12px', colors: '#6B7280' },
        rotate: -45,
        rotateAlways: categories.length > 14,
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px', colors: ['#6B7280'] },
        formatter: (val: number) => Math.round(val).toString(),
      },
      title: { text: '' },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Jobs Posted by Day
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily count of new job postings
          </p>
        </div>
      </div>
      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="h-[240px] min-w-[600px]">
          <ReactApexChart options={options} series={series} type="area" height={240} />
        </div>
      </div>
    </div>
  );
}
