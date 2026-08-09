/* eslint-disable react/prop-types */
import * as React from 'react';
import { cn } from '../utils';

export function BaseTableElement({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse', className)} {...props} />;
}

export function BaseTableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props} />;
}

export function BaseTableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('pt-3', className)} {...props} />;
}

export function BaseTableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn(className)} {...props} />;
}

export function BaseTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('group', className)} {...props} />;
}

export function BaseTableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('text-2-regular text-dim px-3 py-2 text-left border-b border-hover', className)} {...props} />;
}

export function BaseTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('h-12 px-3 text-2-regular text-text-primary', className)} {...props} />;
}
