'use client';
import React from 'react';
import { motion } from 'framer-motion';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: React.ReactNode;
  /** Seconds to wait after the element scrolls into view. */
  delay?: number;
  className?: string;
}

/** Fades and lifts its content in the first time it scrolls into view. */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
