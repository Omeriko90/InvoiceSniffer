import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import { SensitiveInput } from "../input/SensitiveInput";
import { cn } from "../utils";
import { InputProps } from "../input/Input";

export interface FormSensitiveInputProps<T extends FieldValues>
  extends UseControllerProps<T> {
  hideError?: boolean;
  label?: string;
  inputLabel?: string;
  placeholder?: string;
  fullWidth?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  required?: boolean;
  inputSize?: InputProps["size"];
  tooltipTitle?: string;
}

function FormSensitiveInput<T extends FieldValues>(
  props: FormSensitiveInputProps<T>,
) {
  const {
    name,
    label,
    inputLabel,
    placeholder = "Type here...",
    fullWidth,
    hideError,
    required,
    containerClassName,
    inputClassName,
    labelClassName,
    inputSize,
    tooltipTitle,
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
            <SensitiveInput
              {...field}
              label={inputLabel}
              placeholder={placeholder}
              inputClassName={inputClassName}
              error={!!fieldState.error}
              size={inputSize}
              tooltipTitle={tooltipTitle}
            />
            {fieldState.error && !hideError && (
              <span className="text-danger absolute -bottom-[18px] text-xs pl-1 pt-0.5">
                {fieldState?.error?.message || "Required"}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

export { FormSensitiveInput };