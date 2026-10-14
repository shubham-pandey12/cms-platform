'use client';

import React from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { WidgetInstance } from '@/types/cms';
import { Badge } from '@/components/ui/badge';
import {
  Settings2, 
  Copy, 
  Trash2,
  GripVertical,
  EyeOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { DynamicWidgetRenderer } from './DynamicWidgetRenderer';

interface SortableWidgetProps {
  widgetInstance: WidgetInstance;
  isPreview?: boolean;
  columnId: string;
  sectionId: string;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ 
  widgetInstance,
  isPreview = false,
  columnId,
  sectionId,
}) => {
  // All hooks must be called before any early returns
  const { 
    selectedWidgetId, 
    selectWidget, 
    removeWidget, 
    duplicateWidget,
    widgetDefinitions,
    activeTheme,
    isPreviewMode
  } = usePageBuilder();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `widget-${widgetInstance?.id || 'unknown'}` });

  // Null checks
  if (!widgetInstance || !widgetInstance.id) {
    return null;
  }
  
  const widgetDef = widgetDefinitions.find(
    w => w && (w.id === widgetInstance.widgetDefinitionId || w.slug === widgetInstance.widgetDefinitionId)
  );
  
  // If widget definition not found, show placeholder
  if (!widgetDef) {
    return (
      <div className="p-4 border border-dashed border-muted rounded-lg text-center text-sm text-muted-foreground">
        Unknown widget: {widgetInstance.widgetDefinitionId}
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedWidgetId === widgetInstance.id;
  const isHidden = widgetInstance.isVisible === false;

  // In preview mode, just render the widget without controls
  if (isPreview) {
    if (isHidden) return null;
    return (
      <div className="relative">
        <DynamicWidgetRenderer
          widgetInstance={widgetInstance}
          widgetDefinition={widgetDef}
          theme={activeTheme}
          isPreviewMode={true}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all cursor-pointer",
        isDragging && "opacity-50 z-50",
        isHidden && "opacity-40"
      )}
      onClick={(e) => {
        // Select widget when clicking anywhere on it
        // Allow clicks to bubble unless it's an interactive element
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, a, input, textarea, select, [role="button"]');
        if (!isInteractive) {
          selectWidget(widgetInstance.id);
        }
      }}
    >
      {/* Hidden badge */}
      {isHidden && (
        <div className="absolute top-2 right-2 z-30">
          <Badge variant="secondary" className="gap-1">
            <EyeOff className="w-3 h-3" />
            Hidden
          </Badge>
        </div>
      )}

      {/* Selection outline */}
      <div className={cn(
        "absolute inset-0 rounded-lg pointer-events-none transition-all z-10",
        isSelected 
          ? "ring-2 ring-primary ring-offset-2" 
          : "group-hover:ring-2 group-hover:ring-primary/50"
      )} />

      {/* Floating toolbar - Google Sites style */}
      <div className={cn(
        "absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1",
        "bg-popover text-popover-foreground rounded-lg shadow-lg border border-border",
        "px-1 py-1 transition-all z-[60]",
        (isSelected || isDragging) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {/* Drag handle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[100]" sideOffset={5}>Drag to move</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-5 bg-border" />

        {/* Duplicate */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  duplicateWidget(widgetInstance.id); 
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[100]" sideOffset={5}>Duplicate</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Settings */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  selectWidget(widgetInstance.id); 
                }}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[100]" sideOffset={5}>Edit</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-5 bg-border" />

        {/* Delete */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  removeWidget(widgetInstance.id); 
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[100]" sideOffset={5}>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Widget Content - clicks bubble up to parent for selection */}
      <div className="relative">
        <DynamicWidgetRenderer
          widgetInstance={widgetInstance}
          widgetDefinition={widgetDef}
          theme={activeTheme}
          isPreviewMode={isPreviewMode}
        />
      </div>
    </div>
  );
};
