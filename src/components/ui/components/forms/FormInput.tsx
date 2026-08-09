import React from "react";
import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import { Input, InputProps } from "../input/Input";
import { cn } from "../utils";

export interface FormInputProps<T extends FieldValues> extends UseControllerProps<T> {
  hideError?: boolean;
  label?: string;
  inputLabel?: string;
  placeholder?: string;
  fullWidth?: boolean;
  type?: string;
  size?: "small" | "medium";
  containerClassName?: string;
  inputClassName?: string;
  onBlur?: () => void;
  labelClassName?: string;
  required?: boolean;
  inputSize?: InputProps["size"];
  disabled?: boolean;
  endAdornment?: React.ReactNode;
  startAdornment?: React.ReactNode;
  hint?: string;
}

function FormInput<T extends FieldValues>(props: FormInputProps<T>) {
  const {
    name,
    label,
    inputLabel,
    placeholder = "Type here...",
    fullWidth,
    type,
    hideError,
    required,
    containerClassName,
    onBlur,
    inputClassName,
    labelClassName,
    inputSize,
    disabled,
    endAdornment,
    startAdornment,
    hint,
  } = props;
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-text-secondary",
            containerClassName,
            { "w-full": fullWidth },
          )}
        >
          {label && (
            <div
              id="label-container"
              className="flex items-center gap-1 min-w-[100px]"
            >
              <span
                className={cn(
                  "text-sm text-text-secondary whitespace-nowrap ",
                  labelClassName,
                )}
              >
                {label}
              </span>

              {required && <span className="text-primary text-sm">*</span>}
            </div>
          )}
          <div className="flex flex-col gap-1 w-full relative">
            <Input
              {...field}
              onChange={field.onChange}
              onBlur={onBlur ?? field.onBlur}
              label={inputLabel}
              placeholder={placeholder}
              className={"w-full"}
              inputClassName={inputClassName}
              error={!!fieldState.error}
              type={type || "text"}
              size={inputSize}
              disabled={disabled}
              endAdornment={endAdornment}
              startAdornment={startAdornment}
              hint={hint}
            />
            {fieldState.error && !hideError && (
              <span className="text-danger absolute top-full text-xs pl-1 pt-0.5">
                {fieldState?.error?.message || "Required"}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

export { FormInput };