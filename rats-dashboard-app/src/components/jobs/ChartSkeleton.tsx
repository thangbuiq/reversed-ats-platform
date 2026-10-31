import React from 'react';

const CHART_HEIGHT = 300;
const WAVE_CLIP =
  'polygon(0 100%, 0 70%, 8% 45%, 16% 62%, 26% 30%, 36% 55%, 46% 40%, 56% 68%, 68% 25%, 80% 50%, 90% 35%, 100% 20%, 100% 100%)';
const BAR_WIDTHS = ['92%', '78%', '64%', '58%', '47%', '40%', '31%', '24%'];

interface ChartSkeletonProps {
  variant: 'line' | 'bar';
  title: string;
  description: string;
}

/** Shimmering placeholder shaped like the chart it stands in for while jobs load. */
export default function ChartSkeleton({ variant, title, description }: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="h-full min-w-0 overflow-hidden border border-gray-200 bg-white p-4 sm:p-5 md:p-6 dark:border-gray-400/20 dark:bg-gray-800"
    >
      <h3 className="font-display mb-1 text-xl font-medium text-gray-900">{title}</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <span className="sr-only">Loading chart</span>
      {variant === 'line' ? (
        <div className="skeleton mt-6" style={{ height: CHART_HEIGHT - 48, clipPath: WAVE_CLIP }} />
      ) : (
        <div className="flex flex-col justify-between gap-3 pt-8" style={{ height: CHART_HEIGHT }}>
          {BAR_WIDTHS.map((width) => (
            <div key={width} className="flex items-center gap-3">
              <div className="skeleton h-3 w-20 shrink-0" />
              <div className="skeleton h-4" style={{ width }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
