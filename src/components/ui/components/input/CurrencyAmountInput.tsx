import { useMemo } from "react";
import { Autocomplete } from "../autocomplete";
import { currencyToCountryMapping } from "../lib/rate-utils";
import { CurrencyAndAmountColumn as CurrencyAndAmount } from "../table/columns/CurrencyAndAmountColumn";
import { AmountInput } from "./AmountInput";

export interface CurrencyAmountInputProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  amount?: number;
  onAmountChange: (amount: number) => void;
  hint?: string;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  allowedCurrencies?: string[];
}

export function CurrencyAmountInput(props: CurrencyAmountInputProps) {
  const {
    currency,
    onCurrencyChange,
    amount,
    onAmountChange,
    hint,
    label,
    disabled,
    size = "md",
    allowedCurrencies,
  } = props;
  const currencies = Object.keys(currencyToCountryMapping);
  const options = useMemo(
    () =>
      allowedCurrencies
        ? currencies
            .filter((currency) => allowedCurrencies.includes(currency))
            .map((currency) => ({ value: currency, label: currency }))
        : currencies.map((currency) => ({ value: currency, label: currency })),
    [allowedCurrencies],
  );
  return (
    <AmountInput
      hint={hint}
      value={amount}
      disabled={disabled}
      label={label}
      inputWrapperClassName="pr-[3px]"
      size={size}
      onChange={(value) => onAmountChange(Number(value))}
      endAdornment={
        <Autocomplete
          variant="ghost"
          value={{ value: currency, label: currency }}
          disabled={disabled}
          size={size === "sm" ? "small" : "medium"}
          popoverContentProps={{ sideOffset: 10 }}
          popoverContentClassName="w-[140px]"
          onChange={(value) => onCurrencyChange(value.value)}
          options={options}
          renderOption={({ value }) => (
            <CurrencyAndAmount
              currency={value}
              size={20}
              containerClassName="gap-1.5"
            />
          )}
        />
      }
    />
  );
}
