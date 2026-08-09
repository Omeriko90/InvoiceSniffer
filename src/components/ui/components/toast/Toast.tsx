import React from 'react';
import { X, CircleAlert, CircleCheck } from 'lucide-react';
import { IconButton } from '../buttons/IconButton';

export type ToastVariant = 'default' | 'error' | 'success';

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
  closeToast?: () => void;
};

export function Toast({ message, variant = 'default', closeToast }: ToastProps) {
  return (
    <div className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg bg-heading w-max">
      {variant === 'error' && <CircleAlert size={20} className="shrink-0 text-danger" />}
      {variant === 'success' && <CircleCheck size={20} className="shrink-0 text-success" />}
      <span className="text-1-regular text-primary-foreground flex-1">{message}</span>
      <IconButton icon={X} aria-label="Close" variant="inverted" size="lg" shape="round" onClick={closeToast} />
    </div>
  );
}
