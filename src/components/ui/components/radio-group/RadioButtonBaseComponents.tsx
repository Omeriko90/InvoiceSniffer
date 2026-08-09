import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

export type RadioButtonVariant = "default" | "chip";

const radioItemVariants = cva(
  "group flex items-center border bg-primary border-border data-[state=checked]:border-primary disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "h-12 w-full gap-2 px-3 rounded-lg text-left",
        chip: "h-8 justify-center gap-1 px-3 rounded-full",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function BaseRadioButtonGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup.Root>) {
  return (
    <RadioGroup.Root
      data-slot="radio-button-group"
      className={cn("flex gap-2 w-full", className)}
      {...props}
    />
  );
}

function BaseRadioButtonItem({
  label,
  variant,
  error,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup.Item> & {
  label: string;
  variant?: RadioButtonVariant;
  error?: boolean;
}) {
  return (
    <RadioGroup.Item
      data-slot="radio-button-item"
      className={cn(
        radioItemVariants({ variant }),
        { "border-danger": error },
        className,
      )}
      {...props}
    >
      {variant !== "chip" && (
        <span className="size-5 rounded-full flex items-center justify-center shrink-0 border border-border group-data-[state=checked]:border-2 group-data-[state=checked]:border-primary">
          <RadioGroup.Indicator className="flex items-center justify-center">
            <span className="block size-2 rounded-full bg-primary" />
          </RadioGroup.Indicator>
        </span>
      )}
      <span className="text-2-medium text-text-primary group-disabled:text-faint">
        {label}
      </span>
    </RadioGroup.Item>
  );
}

export { BaseRadioButtonGroup, BaseRadioButtonItem };
