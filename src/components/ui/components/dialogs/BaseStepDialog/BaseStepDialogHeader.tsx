import React from 'react';
import { cn } from '../../utils';
import { MultiStepIndicator } from '../../multi-step-indicator/MultiStepIndicator';
import { DialogHeader, DialogTitle } from '../Dialog';

export interface BaseStepDialogHeaderProps {
  steps: Array<{ title: string; value: string }>;
  currentStepIndex: number;
  isStepIndicatorDisabled?: boolean;
  onStepSelected: (idx: number) => void;
}

export function BaseStepDialogHeader({ steps, currentStepIndex, isStepIndicatorDisabled, onStepSelected }: BaseStepDialogHeaderProps) {
  const isMultiStep = steps.length > 1;

  const handleStepSelected = (idx: number) => {
    if (!isStepIndicatorDisabled) onStepSelected(idx);
  };

  return (
    <DialogHeader>
      {isMultiStep ? (
        <MultiStepIndicator
          titles={steps.map((s) => s.title)}
          currentStepIndex={currentStepIndex}
          className={cn('h-8', { 'cursor-not-allowed': isStepIndicatorDisabled })}
          onStepSelected={handleStepSelected}
        />
      ) : (
        <DialogTitle className="h-8 flex items-center">{steps[0].title}</DialogTitle>
      )}
    </DialogHeader>
  );
}
