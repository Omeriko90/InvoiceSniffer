import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '../utils';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { CheckedState } from '@radix-ui/react-checkbox';

export type CheckboxSize = 'xs' | 'small' | 'medium' | 'large';

export interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  size?: CheckboxSize;
  onCheckedChange: (checked: boolean) => void;
}

const sizeClasses: Record<CheckboxSize, { root: string; indicator: string }> = {
  xs: { root: 'size-3', indicator: '[&>svg]:size-3' },
  small: { root: 'size-3.5', indicator: '[&>svg]:size-3.5' },
  medium: { root: 'size-4', indicator: '[&>svg]:size-4' },
  large: { root: 'size-5', indicator: '[&>svg]:size-5' }
};

function Checkbox({ className, size = 'medium', checked, onCheckedChange, ...props }: CheckboxProps) {
  const { root, indicator } = sizeClasses[size];
  const partialSelection = checked === 'indeterminate';

  const handleCheckedChange = (checked: CheckedState) => {
    onCheckedChange(Boolean(checked));
  };

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...props}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      className={cn(
        'border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-border aria-invalid:aria-checked:border-border aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex items-center justify-center rounded-[4px] border transition-colors group-has-disabled/field:opacity-50 focus-visible:ring-3 aria-invalid:ring-3 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50',
        root,
        className
      )}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn('grid place-content-center rounded-[4px] text-current bg-primary transition-none', indicator)}
      >
        {partialSelection ? <MinusIcon className="text-[#FAFAFA]" /> : <CheckIcon className="text-[#FAFAFA]" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
export { Checkbox };