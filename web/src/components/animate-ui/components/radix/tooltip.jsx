import * as React from 'react';

import {
  TooltipProvider as TooltipProviderPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipContent as TooltipContentPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
  TooltipPortal as TooltipPortalPrimitive,
} from '@/components/animate-ui/primitives/radix/tooltip';
import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return <TooltipProviderPrimitive delayDuration={delayDuration} {...props} />;
}

function Tooltip({
  delayDuration = 0,
  ...props
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}) {
  return <TooltipTriggerPrimitive {...props} />;
}

function TooltipContent({
  className,
  sideOffset,
  children,
  ...props
}) {
  return (
    <TooltipPortalPrimitive>
      <TooltipContentPrimitive
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className
        )}
        {...props}>
        {children}
        <TooltipArrowPrimitive
          className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipContentPrimitive>
    </TooltipPortalPrimitive>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
