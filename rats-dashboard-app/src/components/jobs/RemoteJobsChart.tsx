'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface RemoteJobsChartProps {
  remoteCount: number;
  onsiteCount: number;
}

export default function RemoteJobsChart({ remoteCount, onsiteCount }: RemoteJobsChartProps) {
  const total = remoteCount + onsiteCount;
  if (total === 0) return null;

  const series = [remoteCount, onsiteCount];

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'donut',
    },
    labels: ['Remote', 'On-site'],
    colors: ['#465FFF', '#E5E7EB'],
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      labels: { colors: '#6B7280' },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: '#6B7280' },
            value: { show: true, fontSize: '20px', fontWeight: '700', color: '#1F2937' },
            total: {
              show: true,
              label: 'Remote',
              fontSize: '13px',
              color: '#6B7280',
              formatter: () => `${((remoteCount / total) * 100).toFixed(0)}%`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '13px' },
      y: { formatter: (val: number) => `${val} jobs` },
    },
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { height: 200 } },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        Remote vs On-site
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {remoteCount} remote · {onsiteCount} on-site
      </p>
      <div className="flex h-[240px] justify-center">
        <ReactApexChart options={options} series={series} type="donut" height={240} width={240} />
      </div>
    </div>
  );
}
