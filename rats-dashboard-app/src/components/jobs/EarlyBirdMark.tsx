import React from 'react';
import { Zap } from 'lucide-react';

interface EarlyBirdMarkProps {
  className?: string;
  title?: string;
  /** Posted today: yellow tile instead of the green early bird one. */
  today?: boolean;
}

/** Lightning tile flagging an early bird job: green within the window, yellow when posted today. */
export default function EarlyBirdMark({
  className = '',
  title,
  today = false,
}: EarlyBirdMarkProps) {
  return (
    <span
      title={title}
      aria-hidden="true"
      className={`${today ? 'bg-warning-400 text-gray-900' : 'bg-success-500 text-white'} inline-flex h-4 w-4 shrink-0 items-center justify-center ${className}`}
    >
      <Zap size={10} strokeWidth={2.5} fill="currentColor" />
    </span>
  );
}
