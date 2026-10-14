'use client';

import React, { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DynamicWidgetRenderer } from '@/components/builder/DynamicWidgetRenderer';
import type { ThemeConfig } from '@/contexts/PageBuilderContext';
import type { WidgetDefinition } from '@/types/cms';
import { cn } from '@/lib/utils';
import { buildLibraryPreviewInstance } from './widgetLibraryUtils';

interface WidgetLibraryLivePreviewProps {
  widget: WidgetDefinition;
  theme: ThemeConfig;
}

export function WidgetLibraryLivePreview({ widget, theme }: WidgetLibraryLivePreviewProps) {
  const [open, setOpen] = useState(false);
  const previewInstance = useMemo(() => buildLibraryPreviewInstance(widget), [widget]);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={280} closeDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          title="Preview"
          aria-label={`Preview ${widget.name}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'shrink-0 flex items-center justify-center rounded-md p-2 mt-0.5',
            'text-muted-foreground hover:text-foreground hover:bg-accent/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          <Eye className="h-4 w-4" aria-hidden />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className={cn(
          'w-[min(90vw,28rem)] max-h-[min(50vh,320px)] p-0 overflow-hidden',
          'border bg-popover shadow-lg'
        )}
      >
        {open ? (
          <div className="relative max-h-[min(50vh,320px)] overflow-hidden bg-background">
            <div
              className="pointer-events-none origin-top-left scale-[0.42] max-w-none"
              style={{ width: '238%' }}
            >
              <DynamicWidgetRenderer
                widgetInstance={previewInstance}
                widgetDefinition={widget}
                theme={theme}
                isPreviewMode
              />
            </div>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
