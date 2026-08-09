import { z } from "zod";
import { Controller, useFormContext, type FieldError } from "react-hook-form";
import { cn } from "../utils";
import { InputProps } from "../input/Input";
import { CurrencyAmountInput } from "../input/CurrencyAmountInput";

export const currencyAmountSchema = z.object({
  amount: z.number({ error: "Amount is required" }),
  currency: z.string().min(1, "Currency is required"),
});

export type CurrencyAmountValue = z.infer<typeof currencyAmountSchema>;

export interface FormCurrencyAmountInputProps {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
  hideError?: boolean;
  disabled?: boolean;
  inputSize?: InputProps["size"];
  allowedCurrencies?: string[];
}

export function FormCurrencyAmountInput(
  props: FormCurrencyAmountInputProps,
) {
  const {
    name,
    label,
    className,
    fullWidth,
    hideError,
    disabled,
    inputSize,
    allowedCurrencies,
  } = props;
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: CurrencyAmountValue = field.value ?? {
          amount: undefined,
          currency: allowedCurrencies?.[0] ?? "",
        };
        const error = fieldState.error as
          | (FieldError & { amount?: FieldError; currency?: FieldError })
          | undefined;
        return (
          <div
            className={cn("flex items-center gap-4 relative", className, {
              "w-full": fullWidth,
            })}
          >
            <CurrencyAmountInput
              currency={value.currency}
              onCurrencyChange={(currency) =>
                field.onChange({ ...value, currency })
              }
              amount={value.amount}
              onAmountChange={(amount) => field.onChange({ ...value, amount })}
              disabled={disabled}
              size={inputSize}
              label={label}
              allowedCurrencies={allowedCurrencies}
            />
            {!hideError && (
              <div className="absolute flex justify-end text-sm -bottom-5 w-fit pr-4 pt-0.5">
                <span
                  className={cn("text-text-secondary text-sm", {
                    "text-danger": fieldState.error,
                  })}
                >
                  {error?.message ??
                    error?.amount?.message ??
                    error?.currency?.message}
                </span>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
