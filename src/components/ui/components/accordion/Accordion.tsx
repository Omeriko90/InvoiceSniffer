import * as React from 'react';
import { ComponentPropsWithoutRef, ComponentRef, forwardRef, HTMLAttributes } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '../utils';
import { ChevronDown } from 'lucide-react';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  ComponentRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />;
});

const AccordionTrigger = React.forwardRef<
  ComponentRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  const [triggerContent, triggerActions] = React.Children.toArray(children);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'accordion-trigger flex flex-1 items-center p-3 justify-between font-medium transition-all [&[data-state=open]>div>svg]:rotate-180',
          className
        )}
        {...props}
      >
        <div className="flex flex-1 items-center p-2 justify-between">
        {triggerContent}

        {triggerActions}

        <ChevronDown size={20} strokeWidth={1} className="ml-2 text-text-secondary" />
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef<
  ComponentRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
    containerClassName?: string;
  }
>(function AccordionContent({ className, children, containerClassName, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down p-5 mt-2',
        containerClassName
      )}
      {...props}
    >
      <div className={cn(className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});

const AccordionTriggerActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AccordionTriggerActions(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'actions-container',
        'flex items-center ml-auto',
        'opacity-0 transition-opacity duration-200',
        '[.accordion-trigger[data-state=open]_&]:opacity-100',
        '[.accordion-trigger[data-state=closed]_&]:pointer-events-none',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
});

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, AccordionTriggerActions };
