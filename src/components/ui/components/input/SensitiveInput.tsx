import React, { useState } from 'react';
import { Input, InputProps } from './Input';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { IconButton } from '../buttons/IconButton';

function SensitiveInput(props: Omit<InputProps, 'type' | 'endAdornment'> & { tooltipTitle?: string }) {
  const [isValueVisible, setIsValueVisible] = useState(false);
  const { disabled, tooltipTitle, ...rest } = props;
  const currentTooltipTitle = tooltipTitle ? (isValueVisible ? `Hide ${tooltipTitle}` : `Show ${tooltipTitle}`) : undefined;
  return (
    <Input
      {...rest}
      disabled={disabled}
      type={isValueVisible ? 'text' : 'password'}
      endAdornment={
        !disabled && (
          <IconButton
            icon={isValueVisible ? EyeOffIcon : EyeIcon}
            aria-label="Toggle value visibility"
            tooltipTitle={currentTooltipTitle}
            onClick={() => setIsValueVisible(!isValueVisible)}
          />
        )
      }
    />
  );
}

export { SensitiveInput };