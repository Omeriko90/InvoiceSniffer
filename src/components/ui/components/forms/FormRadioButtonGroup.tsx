import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import { cn } from "../utils";
import { RadioButtonGroup, RadioButtonOption, } from "../radio-group/RadioButtonGroup";

export interface FormRadioButtonGroupProps<T extends FieldValues>
  extends UseControllerProps<T> {
  options: RadioButtonOption[];
  label?: string;
  hideError?: boolean;
  className?: string;
  labelClassName?: string;
  required?: boolean;
}

function FormRadioButtonGroup<T extends FieldValues>(
  props: FormRadioButtonGroupProps<T>,
) {
  const {
    name,
    options,
    label,
    hideError,
    className,
    labelClassName,
    required,
  } = props;
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1 w-full">
          {label && (
            <div className="flex items-center gap-1">
              <span
                className={cn("text-2-regular text-text-primary", labelClassName)}
              >
                {label}
              </span>
              {required && <span className="text-primary text-sm">*</span>}
            </div>
          )}
          <RadioButtonGroup
            value={field.value}
            onValueChange={field.onChange}
            options={options}
            className={className}
          />
          {fieldState.error && !hideError && (
            <span className="text-danger text-xs pl-1 pt-0.5">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  );
}

export { FormRadioButtonGroup };