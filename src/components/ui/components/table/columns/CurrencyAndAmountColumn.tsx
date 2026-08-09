import { CurrencyFlag } from '../../currency-flag/CurrencyFlag';
import React from 'react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../helpers/formatters';

export interface CurrencyColumnProps {
  currency: string;
  size?: number;
  className?: string;
  amount?: number;
  containerClassName?: string;
}

function CurrencyAndAmountColumn({ currency, size = 24, className, amount, containerClassName }: CurrencyColumnProps) {
  const shouldShowAmount = amount != null; // Becuase amout can be 0 and we want to show it
  return (
    <div className={cn('flex items-center gap-2', containerClassName)}>
      <CurrencyFlag currency={currency} size={size} />
      <span className={cn('text-2-regular', className)}>{currency}</span>
      {shouldShowAmount && <span className={cn('text-2-regular', className)}>{formatNumber(amount)}</span>}
    </div>
  );
}

export { CurrencyAndAmountColumn };