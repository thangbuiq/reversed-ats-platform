import React from 'react';
import { levelColor } from '@/lib/jobStats';

interface LevelLabelProps {
  level: string;
  /** Every level present, so the color matches the charts. */
  levels: string[];
  count?: number;
}

/** A job level with its legend color dot. */
export function LevelLabel({ level, levels, count }: LevelLabelProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
      <span
        className="h-2 w-2 shrink-0"
        style={{ backgroundColor: levelColor(level, levels) }}
        aria-hidden="true"
      />
      {level}
      {count !== undefined && <span className="font-mono text-gray-400">{count}</span>}
    </span>
  );
}

interface LevelLegendProps {
  levels: string[];
  counts: Record<string, number>;
}

/** Legend of the job levels shown, matching the chart colors. */
export function LevelLegend({ levels, counts }: LevelLegendProps) {
  const present = levels.filter((level) => counts[level]);
  if (present.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Level legend">
      {present.map((level) => (
        <LevelLabel key={level} level={level} levels={levels} count={counts[level]} />
      ))}
    </div>
  );
}
