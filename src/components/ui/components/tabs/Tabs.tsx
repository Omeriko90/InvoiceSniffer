import React from 'react';
import { BaseTabs, BaseTabsList, BaseTabsTrigger, BaseTabsContent } from './BaseTabsComponents';

export type TabItem = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  listClassName?: string;
};

export function Tabs({ tabs, value, onValueChange, className, listClassName }: TabsProps) {
  return (
    <BaseTabs value={value} onValueChange={onValueChange} className={className}>
      <BaseTabsList className={listClassName}>
        {tabs.map((tab) => (
          <BaseTabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            {tab.label}
          </BaseTabsTrigger>
        ))}
      </BaseTabsList>
      {tabs.map((tab) => (
        <BaseTabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </BaseTabsContent>
      ))}
    </BaseTabs>
  );
}
