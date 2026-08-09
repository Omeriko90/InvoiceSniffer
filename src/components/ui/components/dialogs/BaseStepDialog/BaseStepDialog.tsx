import React, { ReactNode } from 'react';
import { cn } from '../../utils';
import { Dialog, DialogContent } from '../Dialog';
import { BaseStepDialogHeader } from './BaseStepDialogHeader';
import { BaseStepDialogFooter } from './BaseStepDialogFooter';

export interface BaseStepDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  className?: string;
  contentClassName?: string;

  steps: Array<{ title: string; value: string }>;
  currentStep: string;
  setCurrentStep?: (step: string) => void;
  isStepIndicatorDisabled?: boolean;

  backText?: string;
  cancelText?: string;
  confirmText?: string;
  onBack?: (currentStepIndex: number) => void;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;

  children: ReactNode;

  showFeedbackStep?: boolean;
  feedbackStep?: ReactNode;
}

export function BaseStepDialog({
  open,
  onOpenChange,
  className,
  contentClassName,
  steps,
  currentStep,
  setCurrentStep,
  isStepIndicatorDisabled,
  backText,
  cancelText,
  confirmText,
  onBack,
  onConfirm,
  onCancel,
  isConfirmLoading,
  isConfirmDisabled,
  children,
  showFeedbackStep,
  feedbackStep
}: BaseStepDialogProps) {
  const currentStepIndex = steps.findIndex((s) => s.value === currentStep);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex flex-col', className)}>
        {showFeedbackStep ? (
          feedbackStep
        ) : (
          <>
            <BaseStepDialogHeader
              steps={steps}
              currentStepIndex={currentStepIndex}
              isStepIndicatorDisabled={isStepIndicatorDisabled}
              onStepSelected={(idx) => setCurrentStep?.(steps[idx].value)}
            />
            <div className={cn('mt-6 h-full flex flex-col flex-1', contentClassName)}>{children}</div>
            {(onCancel || onConfirm) && (
              <BaseStepDialogFooter
                currentStepIndex={currentStepIndex}
                backText={backText}
                cancelText={cancelText}
                confirmText={confirmText}
                onBack={onBack ? () => onBack(currentStepIndex) : undefined}
                onConfirm={onConfirm}
                onCancel={onCancel}
                isConfirmLoading={isConfirmLoading}
                isConfirmDisabled={isConfirmDisabled}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
