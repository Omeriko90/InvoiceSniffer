import React from 'react';
import { Chip, ChipProps } from './Chip';
import { CurrencyFlag } from '../currency-flag/CurrencyFlag';

export type FlagChipProps = {
  currency: string;
  color: ChipProps['color'];
  onRemove?: () => void;
  className?: string;
};

export function FlagChip({ currency, color, onRemove, className }: FlagChipProps) {
  return (
    <Chip
      startElement={<CurrencyFlag currency={currency} size={16} />}
      text={currency}
      color={color}
      onRemove={onRemove}
      className={className}
    />
  );
}
