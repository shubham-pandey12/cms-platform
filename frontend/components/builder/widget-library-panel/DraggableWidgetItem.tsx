'use client';

import React from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useDraggable } from '@dnd-kit/core';
import type { WidgetDefinition } from '@/types/cms';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/iconRegistry';
import { WidgetLibraryLivePreview } from './WidgetLibraryLivePreview';

interface DraggableWidgetItemProps {
  widget: WidgetDefinition;
  isBrandSpecific?: boolean;
}

export const DraggableWidgetItem: React.FC<DraggableWidgetItemProps> = ({
  widget,
  isBrandSpecific = false,
}) => {
  const { addWidget, activeTheme } = usePageBuilder();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${widget.id}`,
  });

  const IconComponent = getIcon(widget.icon);

  const handleClick = () => {
    addWidget(widget.id, widget.defaultConfig);
  };

  return (
    <div
      className={cn(
        'flex w-full items-stretch rounded-lg border border-transparent transition-colors',
        'hover:bg-accent hover:border-border',
        isDragging && 'opacity-50'
      )}
    >
      <WidgetLibraryLivePreview widget={widget} theme={activeTheme} />
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type="button"
        onClick={handleClick}
        className={cn(
          'flex flex-1 min-w-0 items-start gap-3 p-3 rounded-r-lg text-left',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
        )}
      >
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
          <IconComponent className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="text-sm font-medium text-foreground">{widget.name}</div>
            {isBrandSpecific && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                Brand
              </Badge>
            )}
            {widget.isAdvanced && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Advanced
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">{widget.description}</div>
        </div>
      </button>
    </div>
  );
};
