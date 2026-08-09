import React from 'react';
import { cn } from '../../utils';
import { Avatar, AvatarProps } from '../../avatar/Avatar';
import { Badge, BadgeProps } from '../../badge/Badge';

export interface TextColumnProps {
  text: string;
  className?: string;
  avatarProps?: AvatarProps;
  badgeProps?: BadgeProps;
}

export function TextColumn({ text, className, avatarProps, badgeProps }: TextColumnProps) {
  return (
    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
      {badgeProps && <Badge {...badgeProps} />}
      {avatarProps && <Avatar {...avatarProps} />}
      <span className={cn('block truncate', className)}>{text}</span>
    </div>
  );
}
