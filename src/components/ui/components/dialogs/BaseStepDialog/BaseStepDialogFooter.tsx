import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { DialogFooter } from '../Dialog';
import { Button } from '../../buttons/Button';

export interface BaseStepDialogFooterProps {
  currentStepIndex: number;
  backText?: string;
  cancelText?: string;
  confirmText?: string;
  onBack?: () => void;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
}

export function BaseStepDialogFooter({
  currentStepIndex,
  backText = 'Back',
  cancelText = 'Cancel',
  confirmText = 'Continue',
  onBack,
  onConfirm,
  onCancel,
  isConfirmLoading,
  isConfirmDisabled
}: BaseStepDialogFooterProps) {
  return (
    <DialogFooter className="justify-between">
      <div className="flex-1">
        {onBack && currentStepIndex > 0 && (
          <Button variant="ghost" size="lg" startIcon={<ArrowLeft strokeWidth={1.5} size={16} />} onClick={onBack}>
            {backText}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button variant="ghost" size="lg" onClick={onCancel}>
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button variant="primary" size="lg" onClick={onConfirm} isLoading={isConfirmLoading} disabled={isConfirmDisabled}>
            {confirmText}
          </Button>
        )}
      </div>
    </DialogFooter>
  );
}
