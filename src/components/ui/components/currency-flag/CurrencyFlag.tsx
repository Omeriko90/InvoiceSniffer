import React, { CSSProperties, ReactElement } from 'react';
import { currencyToCountryMapping } from '../lib/rate-utils';
import { Flag } from '../flag/Flag';

export interface CurrencyFlagProps {
  currency: string;
  size: CSSProperties['width'];
}

export function CurrencyFlag(props: CurrencyFlagProps): ReactElement {
  return <Flag countryCode={currencyToCountryMapping[props.currency]?.countryCode} size={props.size} />;
}
