import React from 'react';
import { Zap } from 'lucide-react';

interface EarlyBirdMarkProps {
  className?: string;
  title?: string;
}

/** Green lightning tile that flags a job posted within the early bird window. */
export default function EarlyBirdMark({ className = '', title }: EarlyBirdMarkProps) {
  return (
    <span
      title={title}
      aria-hidden="true"
      className={`bg-success-500 inline-flex h-4 w-4 shrink-0 items-center justify-center text-white ${className}`}
    >
      <Zap size={10} strokeWidth={2.5} fill="currentColor" />
    </span>
  );
}
