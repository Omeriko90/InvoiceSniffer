import * as React from 'react';
import { cn } from '../utils';
import { Button, ButtonProps } from '../buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';

export type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
  className?: string;
  hideCloseButton?: boolean;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
};

export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirmLoading,
  isConfirmDisabled,
  className,
  hideCloseButton,
  confirmButtonProps,
  cancelButtonProps
}: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex flex-col gap-3', className)} hideCloseButton={hideCloseButton}>
        {(title || description) && (
          <DialogHeader className={cn('pr-10 flex flex-col justify-center', { 'h-8': !title })}>
            {title && <DialogTitle className="min-h-8 flex items-center">{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}

        {(onConfirm || onCancel) && (
          <DialogFooter>
            {onCancel && (
              <Button variant="ghost" size="lg" onClick={onCancel} {...cancelButtonProps}>
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                variant="primary"
                size="lg"
                onClick={onConfirm}
                isLoading={isConfirmLoading}
                disabled={isConfirmDisabled}
                {...confirmButtonProps}
              >
                {confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
