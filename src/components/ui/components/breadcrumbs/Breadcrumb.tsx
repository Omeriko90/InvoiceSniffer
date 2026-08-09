/* eslint-disable react/prop-types */
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils';
import { Link } from '../link/Link';

function Breadcrumb({ className, ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" className={className} {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentPropsWithoutRef<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('flex flex-wrap items-center gap-1.5 text-3-medium break-words text-text-secondary', className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentPropsWithoutRef<'li'>) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

export type BreadcrumbLinkProps = {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

function BreadcrumbLink({ href, className, children, onClick }: BreadcrumbLinkProps) {
  return (
    <Link href={href} className={cn('text-2-regular text-text-secondary ', className)} onClick={onClick}>
      {children}
    </Link>
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-text-primary text-2-regular', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn('[&>svg]:size-3.5', className)} {...props}>
      {children ?? <ChevronRight size={14} />}
    </li>
  );
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator };
