import {
  Controller,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "../utils";
import { Autocomplete } from "../autocomplete";
import { Flag } from "../flag/Flag";

export interface FormPhoneNumberInputProps<T extends FieldValues>
  extends UseControllerProps<T> {
  hideError?: boolean;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  onBlur?: () => void;
  className?: string;
  labelClassName?: string;
  countries?: { value: Country; label: string }[];
  defaultCountry?: Country;
}

export function FormPhoneNumberInput<T extends FieldValues>(
  props: FormPhoneNumberInputProps<T>,
) {
  const {
    name,
    placeholder,
    fullWidth,
    hideError,
    className,
    label,
    labelClassName,
    countries,
    defaultCountry,
  } = props;
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState, ...props }) => (
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-text-secondary",
            " [&_div>.PhoneInputCountry]:bg-surface [&_div>.PhoneInputCountry]:border [&_div>.PhoneInputCountry]:border-border [&_div>.PhoneInputCountry]:p-3 [&_div>.PhoneInputCountry]:rounded-lg [&_div>.PhoneInputCountry]:gap-[20px]",
            className,
            {
              "w-full": fullWidth,
              "[&_div>.PhoneInputCountry]:border-danger": fieldState.error,
            },
          )}
          {...props}
        >
          {label && (
            <span
              id="label-container"
              className={cn(
                "text-sm text-text-secondary whitespace-nowrap",
                labelClassName,
              )}
            >
              {label}
            </span>
          )}
          <div className="flex flex-col gap-1 w-full relative">
            <PhoneInput
              placeholder={placeholder}
              defaultCountry={countries?.length ? defaultCountry : "US"}
              className="w-full"
              numberInputProps={{
                className: cn(
                  "flex w-full rounded-lg border border-border bg-surface px-4 text-text-primary placeholder:text-[#626B93] h-[38px]",
                  { "border-danger": fieldState.error },
                ),
              }}
              countrySelectComponent={(selectProps) => {
                const options = countries || selectProps.options;
                const selectedOption = options.find(
                  (o: { value: string; label: string }) =>
                    o.value === selectProps.value,
                );
                const hasMultipleCountries = options?.length > 1;

                return (
                  <Autocomplete
                    placeholder=""
                    disabled={!hasMultipleCountries}
                    options={options}
                    value={selectedOption}
                    searchable
                    popoverContentClassName="w-[150px] min-w-0"
                    onChange={(opt) => selectProps.onChange(opt.value)}
                    error={!!fieldState.error}
                    renderOption={(item, selectedValue) => {
                      return (
                        <div className="flex items-center gap-2">
                          <Flag countryCode={item.value} size={18} />
                          {!selectedValue && (
                            <span className="text-xs text-text-secondary">
                              {item.label}
                            </span>
                          )}
                        </div>
                      );
                    }}
                  />
                );
              }}
              containerComponentProps={{
                className: "w-full flex items-center gap-[5px] border-danger",
              }}
              value={field.value}
              onChange={field.onChange}
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
