import React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '../utils';
import { ChevronDown } from 'lucide-react';

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & { disabled?: boolean }) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      className={cn('collapsible-trigger p-5 flex w-full transition-all cursor-pointer [&[data-state=open]>svg]:rotate-180', {
        'cursor-not-allowed': props.disabled
      })}
      data-slot="collapsible-trigger"
      {...props}
    >
      <div className="flex flex-1 items-center justify-between">
        {props.children}

        <ChevronDown size={16} className="ml-2" strokeWidth={1} />
      </div>
    </CollapsiblePrimitive.CollapsibleTrigger>
  );
}

function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & { className?: string }) {
  const { className, ...rest } = props;
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn('overflow-hidden transition-all data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up', className)}
      {...rest}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
