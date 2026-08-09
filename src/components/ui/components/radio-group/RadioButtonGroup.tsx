import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/Tooltip";
import {
  BaseRadioButtonGroup,
  BaseRadioButtonItem,
  RadioButtonVariant,
} from "./RadioButtonBaseComponents";

export interface RadioButtonOption {
  value: string;
  label: string;
  disabled?: boolean;
  tooltip?: string | null;
}

export interface RadioButtonGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: RadioButtonOption[];
  variant?: RadioButtonVariant;
  error?: boolean;
  className?: string;
}

export function RadioButtonGroup({
  value,
  onValueChange,
  options,
  variant = "default",
  error,
  className,
}: RadioButtonGroupProps) {
  return (
    <BaseRadioButtonGroup
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {options.map((option) => (
        <Tooltip key={option.value} delayDuration={0}>
          <TooltipTrigger asChild>
            <span className={variant === "chip" ? undefined : "flex-1"}>
              <BaseRadioButtonItem
                variant={variant}
                error={error}
                value={option.value}
                label={option.label}
                disabled={option.disabled}
              />
            </span>
          </TooltipTrigger>
          {option.tooltip && (
            <TooltipContent side="top" align="center" sideOffset={6}>
              {option.tooltip}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </BaseRadioButtonGroup>
  );
}
