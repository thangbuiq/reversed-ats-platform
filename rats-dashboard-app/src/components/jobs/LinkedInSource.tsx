import React from 'react';
import { Linkedin } from 'lucide-react';

interface LinkedInSourceProps {
  /** Short form for tight spots such as the job dialog. */
  compact?: boolean;
  className?: string;
}

/** Attribution that every listing comes from public LinkedIn job postings. */
export default function LinkedInSource({ compact = false, className = '' }: LinkedInSourceProps) {
  return (
    <p className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center bg-[#0A66C2] text-white"
      >
        <Linkedin size={12} strokeWidth={0} fill="currentColor" />
      </span>
      <span>
        Source:{' '}
        <a
          href="https://www.linkedin.com/jobs/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-900 underline-offset-2 hover:underline"
        >
          LinkedIn
        </a>
        {compact ? '' : ' public job postings, refreshed regularly.'}
      </span>
    </p>
  );
}
