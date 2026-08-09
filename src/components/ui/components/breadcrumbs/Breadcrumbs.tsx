'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from './Breadcrumb';

export type BreadcrumbEntry = { name: string; link: string };

export type BreadcrumbsProps = {
  /**
   * Breadcrumb trail to render. When omitted, the trail is derived from the
   * current pathname (one crumb per segment, titlecased). Provide `items`
   * explicitly for human-readable names.
   */
  items?: BreadcrumbEntry[];
};

const titleize = (segment: string) =>
  segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

function useDerivedBreadcrumbs(): BreadcrumbEntry[] {
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => ({
    name: titleize(decodeURIComponent(segment)),
    link: '/' + segments.slice(0, index + 1).join('/')
  }));
}

export function Breadcrumbs({ items }: BreadcrumbsProps = {}) {
  const derived = useDerivedBreadcrumbs();
  const breadcrumbs = items ?? derived;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${breadcrumb.name}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.link}>{breadcrumb.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
