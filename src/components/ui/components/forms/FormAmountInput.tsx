import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AmountInput } from "../input/AmountInput";
import { cn } from "../utils";
import { InputProps } from "../input/Input";

export interface FormAmountInputProps {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
  hideError?: boolean;
  required?: boolean;
  maxLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  max?: number;
  inputSize?: InputProps["size"];
  endAdornment?: React.ReactNode;
  startAdornment?: React.ReactNode;
  "data-testid"?: string;
}

export function FormAmountInput(props: FormAmountInputProps) {
  const {
    name,
    label,
    placeholder,
    className,
    fullWidth,
    hideError,
    required,
    maxLabel,
    autoFocus,
    disabled,
    max,
    inputSize,
    endAdornment,
    startAdornment,
    "data-testid": dataTestId,
  } = props;
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div
          className={cn("flex items-center gap-4 relative", className, {
            "w-full": fullWidth,
          })}
        >
          <AmountInput
            {...field}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={disabled}
            max={max}
            size={inputSize}
            label={label}
            required={required}
            error={!!fieldState.error}
            endAdornment={endAdornment}
            startAdornment={startAdornment}
            data-testid={dataTestId}
          />
          {!hideError && (
            <div
              data-testid="field-error-message"
              className="absolute flex justify-end text-sm right-0 bottom-3 w-fit pr-4 pt-0.5"
            >
              <span
                className={cn("text-text-secondary text-sm", {
                  "text-danger": fieldState.error,
                })}
              >
                {maxLabel}
              </span>
            </div>
          )}
        </div>
      )}
    />
  );
}
