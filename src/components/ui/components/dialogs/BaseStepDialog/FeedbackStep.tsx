import React, { ReactNode } from 'react';
import { Button } from '../../buttons/Button';

export interface FeedbackStepProps {
  image: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onClose?: () => void;
  buttonText?: string;
}

export function FeedbackStep({ image, title, subtitle, children, onClose, buttonText = 'Done' }: FeedbackStepProps) {
  return (
    <div className="flex flex-col items-center pt-8 gap-6 w-full">
      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="shrink-0 flex items-center justify-center">{image}</div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="heading-sm-semibold text-text-primary" data-testid="dialog-success-title">
            {title}
          </p>
          {subtitle && <p className="text-2-regular text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-col w-full">{children}</div>}
      {onClose && (
        <div className="flex w-full items-center justify-end">
          <Button size="lg" onClick={onClose}>
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}
