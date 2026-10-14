'use client';

'use client';

import React from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Plus
} from 'lucide-react';
import { SectionRenderer } from './SectionRenderer';

// Note: Widget rendering is handled by SectionRenderer -> ColumnRenderer -> SortableWidget
// This ensures consistent widget ordering and interaction across the application

export const BuilderCanvas: React.FC = () => {
  const { currentPage, addWidget, isPreviewMode, viewport } = usePageBuilder();
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const viewportWidth = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm',
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas canvas-grid">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Page Selected</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a page from the sidebar or create a new one to start building
          </p>
        </div>
      </div>
    );
  }

  const bodyContent = currentPage.bodyContent || [];

  // Preview Mode - Clean rendering without editing controls
  if (isPreviewMode) {
    return (
      <div className="flex-1 bg-canvas overflow-auto">
        <div className={cn("mx-auto transition-all duration-300", viewportWidth[viewport])}>
          {/* Preview Header */}
          <div className="sticky top-0 z-10 bg-sidebar/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Preview Mode</span>
            </div>
            <span className="text-xs text-muted-foreground">{currentPage.uri}</span>
          </div>
          
          {/* Preview Content */}
          <div className="bg-background min-h-screen p-8">
            {bodyContent.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                No content on this page
              </div>
            ) : (
              <div className="space-y-0">
                {bodyContent.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    isPreview={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode - With editing controls
  return (
    <div className="flex-1 bg-canvas canvas-grid overflow-auto p-8">
      <div className={cn("mx-auto transition-all duration-300", viewportWidth[viewport])}>
        {/* Page header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-sm font-medium text-muted-foreground mb-1">
            Editing: {currentPage.uri}
          </h1>
        </div>

        {/* Canvas drop zone */}
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[500px] rounded-xl border-2 border-dashed transition-all",
            isOver 
              ? "border-primary bg-dropzone" 
              : "border-border bg-card/50",
            bodyContent.length === 0 && "flex items-center justify-center"
          )}
        >
          {bodyContent.length === 0 ? (
            <div className="text-center p-8">
              <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Start Building</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Drag widgets from the library on the right, or click a widget to add it
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {bodyContent.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  isPreview={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
