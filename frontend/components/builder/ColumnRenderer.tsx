'use client';

import React from 'react';
import { PageColumn, ResponsiveSpan } from '@/types/cms';
import { SortableWidget } from './SortableWidget';
import { ColumnResizer } from './ColumnResizer';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { getResponsiveSpanClasses } from '@/lib/styleUtils';

interface ColumnRendererProps {
  column: PageColumn;
  sectionId: string;
  sectionColumns: PageColumn[]; // All columns in the section for span calculation
  isPreview?: boolean;
  onColumnClick?: (columnId: string) => void;
  isSelected?: boolean;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  column,
  sectionId,
  sectionColumns,
  isPreview = false,
  onColumnClick,
  isSelected = false,
}) => {
  const { activeTheme, selectColumn, updateColumnSpan } = usePageBuilder();
  
  // Hooks must be called before any early returns
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${column?.id || 'unknown'}`,
  });

  const sortedWidgets = React.useMemo(() => {
    if (!column || !Array.isArray(column.widgets)) {
      return [];
    }
    return [...column.widgets]
      .filter(w => w && w.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [column]);

  // Null checks
  if (!column || !column.id) {
    return null;
  }

  // Ensure sectionColumns is valid array
  const validSectionColumns = Array.isArray(sectionColumns) ? sectionColumns : [];
  if (!Array.isArray(column.widgets)) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      if (onColumnClick) {
        onColumnClick(column.id);
      }
      selectColumn(column.id);
    }
  };

  const handleSpanChange = (newSpan: ResponsiveSpan) => {
    updateColumnSpan(sectionId, column.id, newSpan);
  };

  // Calculate total span used in section (for desktop)
  const totalSpan = validSectionColumns.reduce((sum, col) => sum + (col.span.desktop || 0), 0);

  // Get responsive span classes
  const spanClasses = getResponsiveSpanClasses(column.span);

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        'column-wrapper relative min-h-[50px] group',
        spanClasses,
        isSelected && !isPreview && 'ring-2 ring-blue-500 ring-offset-1',
        isOver && !isPreview && 'ring-2 ring-primary ring-offset-1 bg-primary/5'
      )}
      onClick={handleClick}
    >
      {!isPreview && (
        <ColumnResizer
          currentSpan={column.span}
          totalSpan={totalSpan}
          onSpanChange={handleSpanChange}
        />
      )}
      {sortedWidgets.length === 0 ? (
        <div className={cn(
          'flex items-center justify-center h-32 border-2 border-dashed rounded-lg',
          !isPreview && 'border-border hover:border-primary transition-colors',
          isPreview && 'border-transparent'
        )}>
          {!isPreview && (
            <span className="text-sm text-muted-foreground">Empty column</span>
          )}
        </div>
      ) : (
        <SortableContext
          items={sortedWidgets.map(w => `widget-${w.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedWidgets.map((widget) => {
                return (
                  <SortableWidget
                    key={widget.id}
                    widgetInstance={widget}
                    isPreview={isPreview}
                    columnId={column.id}
                    sectionId={sectionId}
                  />
                );
              })}
          </div>
        </SortableContext>
      )}
    </div>
  );
};
