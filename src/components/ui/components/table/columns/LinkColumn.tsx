import React from 'react';
import { Link } from '../../link/Link';

export interface LinkColumnProps {
  text: string;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}

export function LinkColumn({ text, href, onClick, className }: LinkColumnProps) {
  return (
    <Link href={href} underline onClick={onClick} className={className}>
      {text}
    </Link>
  );
}
