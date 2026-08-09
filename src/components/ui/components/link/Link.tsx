import * as React from 'react';
import NextLink from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const linkVariants = cva('inline-flex items-center gap-1.5', {
  variants: {
    size: {
      sm: 'text-2-regular',
      md: 'text-1-regular'
    },
    color: {
      blue: 'text-primary',
      primary: 'text-text-primary'
    },
    underline: {
      true: 'underline underline-offset-4 decoration-[0.8px]',
      false: ''
    }
  },
  defaultVariants: {
    size: 'sm',
    color: 'blue',
    underline: false
  }
});

export type LinkProps = VariantProps<typeof linkVariants> & {
  href: string;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

function Link({ href, size, color, underline, iconStart, iconEnd, className, children, onClick }: LinkProps) {
  const classes = cn(linkVariants({ size, color, underline }), className);

  const content = (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  );

  if (isExternal(href)) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <NextLink href={href} className={classes} onClick={onClick}>
      {content}
    </NextLink>
  );
}

export { Link };