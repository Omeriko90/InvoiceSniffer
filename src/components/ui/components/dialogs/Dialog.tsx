import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { cn } from '../utils';
import { IconButton } from '../buttons/IconButton';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  // eslint-disable-next-line react/prop-types
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
  // eslint-disable-next-line react/prop-types
>(function DialogContent({ className, children, hideCloseButton, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed -bottom-3 md:bottom-auto min-h-[220px] flex flex-col left-[50%] md:top-[50%] z-50 max-w-[587px] w-full min-w-72 translate-x-[-50%] md:translate-y-[-50%] bg-surface p-6 shadow-[0_14px_30px_-4px_rgba(0,0,0,0.07)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl',
          className
        )}
        {...props}
      >
        <VisuallyHidden>
          <DialogTitle>Hidden title for resolving console warnings</DialogTitle>
        </VisuallyHidden>
        {children}
        {!hideCloseButton && (
          <DialogClose asChild>
            <IconButton
              icon={X}
              aria-label="Close"
              variant="neutral"
              fill="solid"
              shape="round"
              size="lg"
              className="absolute right-6 top-6"
            />
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

// eslint-disable-next-line react/prop-types
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-0.5', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

// eslint-disable-next-line react/prop-types
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-2 mt-auto', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
  // eslint-disable-next-line react/prop-types
>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn('heading-sm-semibold text-text-primary', className)} {...props} />;
});

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
  // eslint-disable-next-line react/prop-types
>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn('text-2-regular text-text-secondary', className)} {...props} />;
});

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
};
