import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full select-none', {
  variants: {
    color: {
      'subtle-blue': 'bg-primary-soft',
      'subtle-purple': 'bg-purple-bg',
      purple: 'bg-purple'
    },
    size: {
      sm: 'size-8',
      md: 'size-10',
      lg: 'size-[72px]'
    }
  },
  defaultVariants: {
    color: 'subtle-purple',
    size: 'sm'
  }
});

const avatarFallbackVariants = cva('flex size-full items-center justify-center rounded-full', {
  variants: {
    color: {
      'subtle-blue': 'text-primary',
      'subtle-purple': 'text-purple',
      purple: 'text-primary-foreground'
    },
    size: {
      sm: 'text-2-medium',
      md: 'text-1-medium',
      lg: 'heading-md-medium'
    }
  },
  defaultVariants: {
    color: 'subtle-purple',
    size: 'sm'
  }
});

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  name: string;
  src?: string;
  className?: string;
};

export function Avatar({ name, src, color, size, className }: AvatarProps) {
  const initials = _getInitials(name);

  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ color, size }), className)}>
      {src && <AvatarPrimitive.Image src={src} alt={name} className="aspect-square size-full object-cover" />}
      <AvatarPrimitive.Fallback delayMs={src ? 600 : 0} className={avatarFallbackVariants({ color, size })}>
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

function _getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .replace(/[(),-]/g, '')
    .slice(0, 2);
}
