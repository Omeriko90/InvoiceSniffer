import React from "react";
import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import { cn } from "../utils";
import { Autocomplete, AutocompleteProps } from "../autocomplete";
import type { SelectOption } from "./FormSelectInput";

export interface FormMultiSelectInputProps<T extends FieldValues>
  extends UseControllerProps<T> {
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  hideError?: boolean;
  className?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
  size?: AutocompleteProps["size"];
}

function FormMultiSelectInput<T extends FieldValues>(
  props: FormMultiSelectInputProps<T>,
) {
  const {
    name,
    options,
    label,
    placeholder,
    disabled,
    hideError,
    className,
    renderOption,
    size,
  } = props;
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedOptions = options.filter((o) =>
          (field.value as string[]).includes(o.value),
        );
        return (
          <div className={cn("flex flex-col gap-1 w-full", className)}>
            {label && <span className="text-sm text-text-secondary">{label}</span>}
            <Autocomplete
              multiple
              options={options}
              values={selectedOptions}
              onMultiChange={(selected) =>
                field.onChange(selected.map((o) => o.value))
              }
              placeholder={placeholder}
              disabled={disabled}
              error={!!fieldState.error}
              searchable
              renderOption={renderOption}
              size={size}
            />
            {fieldState.error && !hideError && (
              <span className="text-danger text-xs pl-1 pt-0.5">
                {fieldState.error.message}
              </span>
            )}
          </div>
        );
      }}
    />
  );
}

export { FormMultiSelectInput };