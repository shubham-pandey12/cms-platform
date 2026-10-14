'use client';

import React from 'react';
import { PageSection } from '@/types/cms';
import { ColumnRenderer } from './ColumnRenderer';
import { SectionToolbar } from './SectionToolbar';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { getResponsivePadding, getResponsiveMargin } from '@/lib/styleUtils';

interface SectionRendererProps {
  section: PageSection;
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  isSelected?: boolean;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  isPreview = false,
  onSectionClick,
  isSelected = false,
}) => {
  const {
    selectSection,
    addColumn,
    removeSection,
    updateSectionLayout,
    updateSectionStyles,
    widgetDefinitions,
  } = usePageBuilder();
  
  // Hooks must be called before any early returns
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `section-${section?.id || 'unknown'}`,
  });

  // Null checks
  if (!section) {
    return null;
  }

  // Ensure columns array exists and is valid
  const columns = section.columns || [];
  if (!Array.isArray(columns)) {
    return null;
  }

  const handleClick = () => {
    if (!isPreview) {
      if (onSectionClick) {
        onSectionClick(section.id);
      }
      selectSection(section.id);
    }
  };

  const handleAddColumn = () => {
    const defaultSpan = Math.floor(12 / (columns.length + 1));
    addColumn(section.id, { mobile: 12, tablet: defaultSpan, desktop: defaultSpan });
  };

  const handleDeleteSection = () => {
    if (confirm('Are you sure you want to delete this section?')) {
      removeSection(section.id);
    }
  };

  const handleChangeLayout = (layout: PageSection['layout']) => {
    updateSectionLayout(section.id, layout);
  };

  // Determine grid classes based on layout - responsive 12-column grid
  const getGridClasses = () => {
    // Always use 12-column grid system for flexibility
    // Individual columns control their span (1-12)
    return 'grid-cols-12';
  };

  // Section wrapper must not impose spacing. Widgets control their own spacing.
  const effectivePadding = { mobile: '0', tablet: '0', desktop: '0' };
  const effectiveMargin = { mobile: '0', tablet: '0', desktop: '0' };

  // Get section styles
  const sectionStyles: React.CSSProperties = {
    backgroundColor: section.styles?.backgroundColor,
  };

  // Add responsive padding/margin via CSS custom properties
  const sectionStyleWithMedia = {
    ...sectionStyles,
    '--padding-mobile': effectivePadding.mobile,
    '--padding-tablet': effectivePadding.tablet,
    '--padding-desktop': effectivePadding.desktop,
    '--margin-mobile': effectiveMargin.mobile,
    '--margin-tablet': effectiveMargin.tablet,
    '--margin-desktop': effectiveMargin.desktop,
  } as React.CSSProperties & {
    '--padding-mobile': string;
    '--padding-tablet': string;
    '--padding-desktop': string;
    '--margin-mobile': string;
    '--margin-tablet': string;
    '--margin-desktop': string;
  };

  const containerMaxWidth = section.styles?.containerMaxWidth || 'full';
  const maxWidthClass = {
    'full': 'max-w-full',
    'xl': 'max-w-7xl',
    'lg': 'max-w-5xl',
    'md': 'max-w-3xl',
  }[containerMaxWidth] || 'max-w-full';
  return (
    <div
      ref={setDroppableRef}
      className={cn(
        'section-wrapper relative group',
        !section.styles?.fullWidth && 'mx-auto',
        maxWidthClass,
        isSelected && !isPreview && 'ring-2 ring-primary ring-offset-2',
        isOver && !isPreview && 'ring-2 ring-primary/50 ring-offset-1'
      )}
      style={sectionStyleWithMedia}
      onClick={handleClick}
    >
      <style>{`
        .section-wrapper {
          padding: var(--padding-mobile, 0);
          margin: var(--margin-mobile, 0);
        }
        @media (min-width: 768px) {
          .section-wrapper {
            padding: var(--padding-tablet, 0);
            margin: var(--margin-tablet, 0);
          }
        }
        @media (min-width: 1024px) {
          .section-wrapper {
            padding: var(--padding-desktop, 0);
            margin: var(--margin-desktop, 0);
          }
        }
      `}</style>
      {!isPreview && (
        <SectionToolbar
          section={section}
          onAddColumn={handleAddColumn}
          onDeleteSection={handleDeleteSection}
          onChangeLayout={handleChangeLayout}
          isSelected={isSelected}
        />
      )}
      <div 
        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 lg:gap-6"
      >
        {columns.length === 0 ? (
          <div className="col-span-12 flex items-center justify-center h-32 text-sm text-muted-foreground">
            {!isPreview && 'Empty section - add columns to get started'}
          </div>
        ) : (
          columns.map((column) => {
            if (!column || !column.id) return null;
            return (
              <ColumnRenderer
                key={column.id}
                column={column}
                sectionId={section.id}
                sectionColumns={columns}
                isPreview={isPreview}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
