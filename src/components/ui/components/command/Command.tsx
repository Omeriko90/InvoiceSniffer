import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Search } from 'lucide-react';

import { Dialog, DialogContent } from '../dialogs/Dialog';
import { ComponentPropsWithoutRef, ComponentRef, forwardRef, HTMLAttributes } from 'react';
import { cn } from '../utils';

const Command = forwardRef<ComponentRef<typeof CommandPrimitive>, ComponentPropsWithoutRef<typeof CommandPrimitive>>(function Command(
  { className, ...props },
  ref
) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-surface text-text-primary', className)}
      {...props}
    />
  );
});

export type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export interface CommandInputProps extends ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  inputClassName?: string;
  minimal?: boolean;
}

const CommandInput = forwardRef<ComponentRef<typeof CommandPrimitive.Input>, CommandInputProps>(function CommandInput(
  { className, inputClassName, minimal, ...props },
  ref
) {
  if (minimal) {
    return (
      <CommandPrimitive.Input
        ref={ref}
        className={cn('ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground', inputClassName, className)}
        {...props}
      />
    );
  }
  return (
    // eslint-disable-next-line react/no-unknown-property
    <div className="flex items-center border-b px-2" cmdk-input-wrapper="">
      <Search className="h-4 w-4 shrink-0 text-text-secondary" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'flex w-full bg-transparent py-2 text-sm outline-none placeholder:text-dim',
          'pl-2',
          inputClassName,
          className
        )}
        {...props}
      />
    </div>
  );
});

const CommandList = forwardRef<ComponentRef<typeof CommandPrimitive.List>, ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(
  function CommandList({ className, ...props }, ref) {
    return <CommandPrimitive.List ref={ref} className={cn('max-h-80 overflow-y-auto overflow-x-hidden py-2', className)} {...props} />;
  }
);

const CommandEmpty = forwardRef<ComponentRef<typeof CommandPrimitive.Empty>, ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(
  function CommandEmpty({ className, ...props }, ref) {
    return <CommandPrimitive.Empty ref={ref} className={cn('px-2 text-sm pointer-events-none text-text-secondary', className)} {...props} />;
  }
);

const CommandGroup = forwardRef<ComponentRef<typeof CommandPrimitive.Group>, ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(
  function CommandGroup({ className, ...props }, ref) {
    return (
      <CommandPrimitive.Group
        ref={ref}
        className={cn(
          '[&_[cmdk-group-heading]]:text-text-secondary  [&_[cmdk-group-heading]]:pr-3 [&_[cmdk-group-heading]]:pl-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-3-regular overflow-hidden',
          className
        )}
        {...props}
      />
    );
  }
);

const CommandSeparator = forwardRef<
  ComponentRef<typeof CommandPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...props }, ref) {
  return <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-border', className)} {...props} />;
});

export interface CommandItemProps extends ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  selected?: boolean;
}

const CommandItem = forwardRef<ComponentRef<typeof CommandPrimitive.Item>, CommandItemProps>(function CommandItem(
  { className, selected, disabled, onSelect, ...props },
  ref
) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex select-none items-center rounded-md px-2 py-2 text-sm outline-none justify-between',
        'cursor-pointer',
        'h-6 m-1',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        { 'hover:bg-primary-soft h-6 m-1 hover:bg-opacity-50': !selected },
        { 'bg-primary-soft rounded-sm': selected },
        { 'opacity-50 cursor-not-allowed': disabled },
        className
      )}
      disabled={disabled}
      onSelect={disabled ? undefined : onSelect}
      {...props}
    >
      {props.children}
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </CommandPrimitive.Item>
  );
});

const CommandShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />;
};

const CommandLoading = forwardRef<ComponentRef<typeof CommandPrimitive.Loading>, ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>>(
  function CommandLoading({ className, ...props }, ref) {
    return <CommandPrimitive.Loading ref={ref} className={cn('py-2.5 px-3 text-sm', className)} {...props} />;
  }
);

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandLoading
};
