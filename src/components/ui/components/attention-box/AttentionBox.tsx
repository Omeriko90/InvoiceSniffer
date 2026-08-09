import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowUpRight, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import React from 'react';

import { cn } from '../utils';

export type AttentionBoxType = 'error' | 'warning' | 'info' | 'neutral';

export interface AttentionBoxLink {
  text: string;
  href: string;
}

export interface AttentionBoxProps extends VariantProps<typeof attentionBoxVariants> {
  description: React.ReactNode;
  title?: string;
  link?: AttentionBoxLink;
  showIcon?: boolean;
  className?: string;
}

const attentionBoxVariants = cva('flex gap-2 px-4 py-3 rounded-md w-full', {
  variants: {
    type: {
      error: 'bg-danger-bg',
      warning: 'bg-warning',
      info: 'bg-primary-soft',
      neutral: 'bg-hover'
    }
  },
  defaultVariants: {
    type: 'info'
  }
});

const iconVariants = cva('', {
  variants: {
    type: {
      error: 'text-danger',
      warning: 'text-warning',
      info: 'text-info',
      neutral: 'text-text-primary'
    }
  },
  defaultVariants: {
    type: 'info'
  }
});

const ICON_COMPONENT: Record<AttentionBoxType, React.ElementType> = {
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
  neutral: Info
};

export function AttentionBox({ type, title, description, link, showIcon, className }: AttentionBoxProps) {
  const Icon = ICON_COMPONENT[(type ?? 'info') as AttentionBoxType];

  return (
    <div className={cn(attentionBoxVariants({ type }), className)}>
      {showIcon && (
        <div className="pt-0.5 shrink-0">
          <Icon size={16} className={iconVariants({ type })} />
        </div>
      )}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="flex flex-col gap-0.5">
          {title && <p className="text-2-semibold text-text-primary">{title}</p>}
          <p className="text-2-regular text-text-primary">{description}</p>
        </div>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-2-regular text-text-primary underline w-fit"
          >
            {link.text}
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
