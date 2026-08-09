import React from 'react';
import { BaseDialog } from './BaseDialog';

export function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { onAccept, onCancel, title, content, isAcceptButtonLoading, open } = props;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onCancel}
      title={title}
      description={content}
      confirmText="Yes"
      cancelText="No"
      onConfirm={onAccept}
      onCancel={onCancel}
      isConfirmLoading={isAcceptButtonLoading}
    />
  );
}

export interface ConfirmationDialogProps {
  title: string;
  content: string;
  onAccept: () => void;
  onCancel: () => void;
  open: boolean;
  isAcceptButtonLoading?: boolean;
}
