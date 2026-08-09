import React, { CSSProperties, ReactElement } from 'react';
import 'flag-icons/css/flag-icons.min.css';

export interface FlagProps {
  countryCode: string;
  size: CSSProperties['width'];
}

export function Flag(props: FlagProps): ReactElement {
  const { size } = props;

  return (
    <div className="flex">
      <span
        // `before:!content-none` overrides flag-icons' own `.fi:before` content
        // (the production "weird character" workaround); `!important` keeps it
        // winning regardless of stylesheet import order.
        className={`fi fi-${props.countryCode?.toLowerCase()} fis rounded-full border border-border before:!content-none`}
        style={{ height: size, width: size }}
      />
    </div>
  );
}
