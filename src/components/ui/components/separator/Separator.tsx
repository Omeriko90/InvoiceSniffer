import React, { CSSProperties, ReactElement } from 'react';
import { cn } from '../utils';

export interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  style?: CSSProperties;
}

export function Separator(props: SeparatorProps): ReactElement {
  const { orientation } = props;

  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        'm-0 border-0 border-solid border-border',
        {
          'h-0 w-full border-t': orientation !== 'vertical',
          'h-full w-0 border-l': orientation === 'vertical'
        },
        props.className
      )}
      role="separator"
      style={props.style}
    />
  );
}
