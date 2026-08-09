import * as React from 'react';
import { cn } from '../utils';
import { Button } from '../buttons/Button';
import { Dialog, DialogContent, DialogFooter } from './Dialog';
import { Tabs, TabItem } from '../tabs/Tabs';
import { useState } from 'react';
import { AnimateChangeInHeight } from '../animate-change-in-height/AnimateChangeInHeight';

export type TabsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (value: string) => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
  className?: string;
  hideCloseButton?: boolean;
};

export function TabsDialog({
  open,
  onOpenChange,
  tabs,
  defaultTab,
  onTabChange,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirmLoading,
  isConfirmDisabled,
  className,
  hideCloseButton
}: TabsDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex flex-col gap-6', className)} hideCloseButton={hideCloseButton}>
        <AnimateChangeInHeight className="overflow-visible">
          <Tabs tabs={tabs} value={activeTab} onValueChange={handleTabChange} className="gap-6" listClassName="w-full h-8 pr-10" />
        </AnimateChangeInHeight>

        {(onConfirm || onCancel) && (
          <DialogFooter>
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
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { TabItem };
