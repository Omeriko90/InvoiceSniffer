import React from 'react';
import { MultiStepIndicatorItem } from './MultiStepIndicatorItem';

export function MultiStepIndicator(props: MultiStepIndicatorProps) {
  const { titles, onStepSelected, currentStepIndex, className } = props;

  return (
    <div className="flex items-center gap-4">
      {titles.map((title, idx) => (
        <MultiStepIndicatorItem
          key={`stepIndicator-${title}`}
          className={className}
          index={idx}
          title={title}
          current={currentStepIndex === idx}
          completed={currentStepIndex > idx}
          onClick={() => {
            if (currentStepIndex > idx) {
              onStepSelected(idx);
            }
          }}
        />
      ))}
    </div>
  );
}

export interface MultiStepIndicatorProps {
  titles: string[];
  onStepSelected: (stepIdx: number) => void;
  currentStepIndex: number;
  completionTitle?: string;
  showCompletionStep?: boolean;
  className?: string;
}
