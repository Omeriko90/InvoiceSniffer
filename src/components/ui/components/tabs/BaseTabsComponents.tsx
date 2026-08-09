/* eslint-disable react/prop-types */
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../utils';

function BaseTabs({ className, orientation = 'horizontal', ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  );
}

function BaseTabsList({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });

  React.useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;

    const updateIndicator = () => {
      const active = list.querySelector('[data-state=active]') as HTMLElement | null;
      if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };

    updateIndicator();

    const mutationObserver = new MutationObserver(updateIndicator);
    mutationObserver.observe(list, { attributes: true, childList: true, subtree: true, attributeFilter: ['data-state'] });

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(list);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn('relative flex items-end w-fit bg-transparent p-0 h-auto mb-2', className)}
      {...props}
    >
      {children}
      <span
        className="pointer-events-none absolute bottom-[-2px] h-[2px] bg-primary transition-all ease-in-out duration-300"
        style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
      />
    </TabsPrimitive.List>
  );
}

function BaseTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex  w-fit items-start justify-center shrink-0 rounded-none border-0 bg-transparent px-3 pb-2 text-2-medium whitespace-nowrap cursor-pointer transition-all',
        'text-text-secondary hover:text-text-primary data-[state=active]:text-primary disabled:text-faint disabled:cursor-not-allowed',
        'after:hidden',
        'focus-visible:ring-[3px] focus-visible:ring-primary/50 focus-visible:outline-1 focus-visible:outline-ring',
        className
      )}
      {...props}
    />
  );
}

function BaseTabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 text-sm outline-none', className)} {...props} />;
}

export { BaseTabs, BaseTabsList, BaseTabsTrigger, BaseTabsContent };
