import React, { CSSProperties, Fragment, PropsWithChildren, ReactElement } from 'react';
import { getValidReactChildren } from '../utils';
import { Separator } from '../separator/Separator';
import { cn } from '../utils';

export type SeparatorRow = PropsWithChildren<{
  className?: string;
  gap?: CSSProperties['gap'];
  separatorColor?: CSSProperties['backgroundColor'];
  separatorHeight?: CSSProperties['height'];
}>;

export function SeparatorRow(props: SeparatorRow): ReactElement {
  const controls = getValidReactChildren(props.children);

  return (
    <div
      className={cn('flex flex-row items-center', props.className)}
      style={{
        gap: props.gap || '0.5rem'
      }}
    >
      {controls.map((control, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={index}>
          {index > 0 && (
            <Separator
              orientation="vertical"
              style={{
                borderColor: props.separatorColor,
                height: props.separatorHeight
              }}
            />
          )}
          {control}
        </Fragment>
      ))}
    </div>
  );
}
