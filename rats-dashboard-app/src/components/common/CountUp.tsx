'use client';
import React, { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts from the previous value to `value`, so metric changes read as motion instead of a jump. */
export default function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduceMotion) {
      node.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}
