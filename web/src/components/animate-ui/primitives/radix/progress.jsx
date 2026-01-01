'use client';;
import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { motion } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';

const [ProgressProvider, useProgress] =
  getStrictContext('ProgressContext');

function Progress(props) {
  return (
    <ProgressProvider value={{ value: props.value ?? 0 }}>
      <ProgressPrimitive.Root data-slot="progress" {...props} />
    </ProgressProvider>
  );
}

const MotionProgressIndicator = motion.create(ProgressPrimitive.Indicator);

function ProgressIndicator({
  transition = { type: 'spring', stiffness: 100, damping: 30 },
  ...props
}) {
  const { value } = useProgress();

  return (
    <MotionProgressIndicator
      data-slot="progress-indicator"
      animate={{ x: `-${100 - (value || 0)}%` }}
      transition={transition}
      {...props} />
  );
}

export { Progress, ProgressIndicator, useProgress };
