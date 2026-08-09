import type { ReactElement } from "react";
import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import { cn } from "../utils";
import { Autocomplete, AutocompleteProps } from "../autocomplete";

export interface SelectOption {
  label: string;
  value: string;
}

export enum FormSelectType {
  AUTOCOMPLETE = "autocomplete",
  SELECT = "select",
}

export interface FormSelectInputProps<T extends FieldValues>
  extends UseControllerProps<T> {
  hideError?: boolean;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  onBlur?: () => void;
  className?: string;
  renderOption?: (option: SelectOption) => ReactElement;
  options: SelectOption[];
  labelClassName?: string;
  required?: boolean;
  onSearchChange?: (value: string) => void;
  disabled?: boolean;
  onChange?: (value: string) => void;
  type?: FormSelectType;
  searchable?: boolean;
  size?: AutocompleteProps["size"];
}

function FormSelectInput<T extends FieldValues>(
  props: FormSelectInputProps<T>,
) {
  const {
    name,
    placeholder,
    fullWidth,
    hideError,
    className,
    options,
    renderOption,
    label,
    labelClassName,
    required,
    onSearchChange,
    disabled,
    onChange,
    type = FormSelectType.SELECT,
    searchable = true,
    size,
  } = props;
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState, ...props }) => (
        <div
          className={cn("flex items-center gap-4 rounded-md", className, {
            "w-full": fullWidth,
          })}
          {...props}
        >
          {label && type === FormSelectType.SELECT && (
            <div className="flex items-center gap-1 min-w-[100px]">
              <span
                className={cn(
                  "text-sm text-text-secondary whitespace-nowrap",
                  labelClassName,
                )}
              >
                {label}
              </span>
              {required && <span className="text-primary text-sm">*</span>}
            </div>
          )}
          <div className="flex flex-col gap-1 w-full relative rounded-md">
            <Autocomplete
              label={type === FormSelectType.AUTOCOMPLETE ? label : undefined}
              onSearchValueChange={onSearchChange}
              options={options}
              disabled={disabled}
              value={options.find((o) => o.value === field.value)}
              onChange={(option) => (onChange ?? field.onChange)(option.value)}
              placeholder={placeholder}
              searchable={searchable}
              error={!!fieldState.error}
              renderOption={renderOption}
              size={size}
            />
            {fieldState.error && !hideError && (
              <span className="text-danger absolute -bottom-[18px] text-xs pl-1 pt-0.5">
                {fieldState.error.message}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

export { FormSelectInput };