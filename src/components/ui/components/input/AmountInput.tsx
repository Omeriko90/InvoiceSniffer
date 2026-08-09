import React, { forwardRef, useState } from "react";
import { Input, InputProps } from "./Input";

export interface AmountInputProps
  extends Omit<InputProps, "type" | "onChange" | "min"> {
  value?: number;
  onChange: (value: number | undefined) => void;
  allowNegative?: boolean;
  size?: "sm" | "md";
  amountFormatOptions?: Intl.NumberFormatOptions;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  function AmountInput(props, ref) {
    const {
      value,
      onChange,
      allowNegative = false,
      size = "md",
      amountFormatOptions = {},
      onFocus,
      onBlur,
      ...rest
    } = props;
    const [isFocused, setIsFocused] = useState(false);
    const formattedValue =
      value != null
        ? Intl.NumberFormat("en-US", amountFormatOptions).format(value)
        : "";

    const handleChange = (value: string) => {
      onChange(value === "" ? undefined : Number(value));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        value={isFocused ? value : formattedValue}
        type={!isFocused ? "text" : "number"}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        min={!allowNegative ? 0 : undefined}
        size={size}
        {...rest}
      />
    );
  },
);
