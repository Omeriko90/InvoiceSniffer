import React from 'react';
import { asUTCDateString } from '../../helpers/formatters';
import { TextColumn, TextColumnProps } from './TextColumn';

export interface DateColumnProps extends Omit<TextColumnProps, 'text'> {
  value: string | number | Date;
}

export function DateColumn({ value, ...props }: DateColumnProps) {
  return <TextColumn {...props} text={asUTCDateString(value)} />;
}
