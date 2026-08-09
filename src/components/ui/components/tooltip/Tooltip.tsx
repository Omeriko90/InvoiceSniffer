import * as React from 'react';
import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipArrow = forwardRef<
  ComponentRef<typeof TooltipPrimitive.TooltipArrow>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.TooltipArrow>
>(function TooltipArrow({ className, ...props }, ref) {
  return <TooltipPrimitive.TooltipArrow ref={ref} className={cn('fill-black', className)} {...props} />;
});

const TooltipContent = forwardRef<ComponentRef<typeof TooltipPrimitive.Content>, ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
  function TooltipContent({ className, sideOffset = 4, alignOffset = 14, side = 'bottom', align = 'start', ...props }, ref) {
    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        side={side}
        align={align}
        className={cn(
          'z-50 overflow-hidden rounded bg-black text-primary-foreground p-2 text-xs shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    );
  }
);

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
