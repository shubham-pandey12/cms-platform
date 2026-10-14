'use client';

import React, { useState } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { WidgetInstance, WidgetDefinition } from '@/types/cms';
import { Badge } from '@/components/ui/badge';
import {
  Settings2,
  Copy,
  Trash2,
  GripVertical,
  EyeOff,
  Replace
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicWidgetRenderer } from './DynamicWidgetRenderer';

interface SortableSiteLayoutWidgetProps {
  widgetInstance: WidgetInstance;
  isPreview?: boolean;
  section: 'header' | 'footer';
}

export const SortableSiteLayoutWidget: React.FC<SortableSiteLayoutWidgetProps> = ({ 
  widgetInstance,
  isPreview = false,
  section,
}) => {
  // All hooks must be called before any early returns
  const {
    selectedSiteLayoutWidgetId,
    selectSiteLayoutWidget,
    removeSiteLayoutWidget,
    replaceSiteLayoutWidget,
    duplicateSiteLayoutWidget,
    widgetDefinitions,
    activeTheme,
    isPreviewMode
  } = usePageBuilder();

  const [replaceOpen, setReplaceOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `site-layout-widget-${section}-${widgetInstance?.id || 'unknown'}` });

  // Null checks
  if (!widgetInstance || !widgetInstance.id) {
    return null;
  }

  const widgetDef = widgetDefinitions.find(
    w => w && (w.id === widgetInstance.widgetDefinitionId || w.slug === widgetInstance.widgetDefinitionId)
  );

  // Widgets suitable for header/footer: prefer Navigation category, otherwise all
  const navigationWidgets = widgetDefinitions.filter(w => w && w.category === 'navigation');
  const replaceOptions = navigationWidgets.length > 0 ? navigationWidgets : widgetDefinitions.filter(Boolean);

  const renderToolbarReplace = (onReplaceSelect: (def: WidgetDefinition) => void) => (
    <Popover open={replaceOpen} onOpenChange={setReplaceOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Replace className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="z-[100]" sideOffset={5}>Replace with...</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-64 p-0" align="center" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 border-b text-sm font-medium text-foreground">Choose widget</div>
        <ScrollArea className="h-56">
          <div className="p-2 space-y-1">
            {replaceOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No widgets available</p>
            ) : (
              replaceOptions.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                  onClick={() => {
                    onReplaceSelect(def);
                    setReplaceOpen(false);
                  }}
                >
                  <span className="font-medium">{def.name}</span>
                  {def.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{def.description}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  // If widget definition not found, show placeholder WITH toolbar so user can Replace or Delete
  if (!widgetDef) {
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const isSelected = selectedSiteLayoutWidgetId === widgetInstance.id;
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative transition-all rounded-lg border border-dashed border-muted min-h-[80px]",
          isDragging && "opacity-50 z-50",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => selectSiteLayoutWidget(widgetInstance.id, section)}
      >
        <div className="p-4 flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground flex-1 text-center">
            Unknown widget: {widgetInstance.widgetDefinitionId}
          </span>
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {renderToolbarReplace((def) => replaceSiteLayoutWidget(section, widgetInstance.id, def.id))}
            <div className="w-px h-5 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeSiteLayoutWidget(section, widgetInstance.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className={cn(
          "absolute inset-0 rounded-lg pointer-events-none",
          isSelected ? "ring-2 ring-primary ring-offset-2" : "group-hover:ring-2 group-hover:ring-primary/50"
        )} />
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedSiteLayoutWidgetId === widgetInstance.id;
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
        "group relative transition-all",
        isDragging && "opacity-50 z-50",
        isHidden && "opacity-40"
      )}
      onClick={() => selectSiteLayoutWidget(widgetInstance.id, section)}
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

        {/* Replace */}
        {renderToolbarReplace((def) => replaceSiteLayoutWidget(section, widgetInstance.id, def.id))}

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
                  duplicateSiteLayoutWidget(section, widgetInstance.id);
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
                  selectSiteLayoutWidget(widgetInstance.id, section); 
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
                  removeSiteLayoutWidget(section, widgetInstance.id); 
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[100]" sideOffset={5}>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Widget Content */}
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
