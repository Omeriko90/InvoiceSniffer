import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: number;
}

export function LoadingSpinner({ size = 16, className, ...props }: LoadingSpinnerProps) {
  return <Loader2 className={cn('animate-spin shrink-0', className)} size={size} {...props} />;
}
