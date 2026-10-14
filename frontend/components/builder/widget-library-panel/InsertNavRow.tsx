'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsertNavRowProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
}

export const InsertNavRow: React.FC<InsertNavRowProps> = ({
  label,
  count,
  isActive,
  onClick,
  icon: Icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
      isActive
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
    )}
  >
    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
    <span className="truncate flex-1 min-w-0">{label}</span>
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 tabular-nums">
      {count}
    </Badge>
  </button>
);
