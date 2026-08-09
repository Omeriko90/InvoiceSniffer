// Vendored shim of `@grain/rate-utils` — only the subset consumed by web-components.
// Source: grain/packages/rate-utils/src/currencies.ts (currencyToCountryMapping).
// Consumed by currency-flag/CurrencyFlag.tsx via `import { currencyToCountryMapping } from '@grain/rate-utils'`.

// Modeled as an erasable const object (the repo's tsconfig sets `erasableSyntaxOnly`,
// which disallows TS enums). Runtime values match the source `@grain/rate-utils` enum.
export const CurrencyHolidaySource = {
  MANUAL: 'manual', // from manual-defined-holidays.ts
  HOLIDAYS: 'holidays' // from date-holidays package
} as const;
export type CurrencyHolidaySource = (typeof CurrencyHolidaySource)[keyof typeof CurrencyHolidaySource];

export interface CurrencyMapping {
  [currencyCode: string]: { countryCode: string; type: CurrencyHolidaySource };
}

// TODO: This should be added to the GrainCurrencyConfig entity
export const currencyToCountryMapping: CurrencyMapping = {
  AED: { countryCode: 'AE', type: CurrencyHolidaySource.MANUAL },
  AUD: { countryCode: 'AU', type: CurrencyHolidaySource.MANUAL },
  BGN: { countryCode: 'BG', type: CurrencyHolidaySource.MANUAL },
  BHD: { countryCode: 'BH', type: CurrencyHolidaySource.MANUAL },
  BRL: { countryCode: 'BR', type: CurrencyHolidaySource.MANUAL },
  BWP: { countryCode: 'BW', type: CurrencyHolidaySource.MANUAL },
  CAD: { countryCode: 'CA', type: CurrencyHolidaySource.MANUAL },
  CHF: { countryCode: 'CH', type: CurrencyHolidaySource.MANUAL },
  CNH: { countryCode: 'CN', type: CurrencyHolidaySource.MANUAL },
  CNY: { countryCode: 'CN', type: CurrencyHolidaySource.MANUAL },
  CZK: { countryCode: 'CZ', type: CurrencyHolidaySource.MANUAL },
  DKK: { countryCode: 'DK', type: CurrencyHolidaySource.MANUAL },
  EUR: { countryCode: 'EU', type: CurrencyHolidaySource.MANUAL },
  GBP: { countryCode: 'GB', type: CurrencyHolidaySource.MANUAL },
  HKD: { countryCode: 'HK', type: CurrencyHolidaySource.MANUAL },
  HUF: { countryCode: 'HU', type: CurrencyHolidaySource.MANUAL },
  IDR: { countryCode: 'ID', type: CurrencyHolidaySource.MANUAL },
  ILS: { countryCode: 'IL', type: CurrencyHolidaySource.MANUAL },
  JPY: { countryCode: 'JP', type: CurrencyHolidaySource.MANUAL },
  KRW: { countryCode: 'KR', type: CurrencyHolidaySource.MANUAL },
  MYR: { countryCode: 'MY', type: CurrencyHolidaySource.MANUAL },
  MXN: { countryCode: 'MX', type: CurrencyHolidaySource.MANUAL },
  NOK: { countryCode: 'NO', type: CurrencyHolidaySource.MANUAL },
  NZD: { countryCode: 'NZ', type: CurrencyHolidaySource.MANUAL },
  OMR: { countryCode: 'OM', type: CurrencyHolidaySource.MANUAL },
  PHP: { countryCode: 'PH', type: CurrencyHolidaySource.MANUAL },
  PLN: { countryCode: 'PL', type: CurrencyHolidaySource.MANUAL },
  QAR: { countryCode: 'QA', type: CurrencyHolidaySource.MANUAL },
  RON: { countryCode: 'RO', type: CurrencyHolidaySource.MANUAL },
  SAR: { countryCode: 'SA', type: CurrencyHolidaySource.MANUAL },
  SEK: { countryCode: 'SE', type: CurrencyHolidaySource.MANUAL },
  SGD: { countryCode: 'SG', type: CurrencyHolidaySource.MANUAL },
  THB: { countryCode: 'TH', type: CurrencyHolidaySource.MANUAL },
  TND: { countryCode: 'TN', type: CurrencyHolidaySource.MANUAL },
  TRY: { countryCode: 'TR', type: CurrencyHolidaySource.MANUAL },
  UGX: { countryCode: 'UG', type: CurrencyHolidaySource.MANUAL },
  USD: { countryCode: 'US', type: CurrencyHolidaySource.MANUAL },
  ZAR: { countryCode: 'ZA', type: CurrencyHolidaySource.MANUAL },
  INR: { countryCode: 'IN', type: CurrencyHolidaySource.MANUAL }
};
