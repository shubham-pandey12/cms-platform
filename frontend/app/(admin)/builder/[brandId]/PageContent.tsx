'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder, PageBuilderProvider } from '@/contexts/PageBuilderContext';
import { getBrandById, getWidgetDefinitions, getWidgetDefinitionById } from '@/services/cmsApiService';
import { Brand, WidgetDefinition } from '@/types/cms';
import { GoogleSitesHeader } from '@/components/builder/GoogleSitesHeader';
import { GoogleSitesCanvas } from '@/components/builder/GoogleSitesCanvas';
import { WidgetLibraryPanel } from '@/components/builder/widget-library-panel';
import { PropertiesPanel } from '@/components/builder/PropertiesPanel';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { copy } from '@/lib/copy';

const PageBuilderContent = () => {
  const params = useParams();
  const brandId = params.brandId as string;
  const { selectBrand } = useAuth();
  const { 
    currentPage, 
    selectedWidgetId,
    selectedSiteLayoutWidgetId,
    addWidget, 
    moveWidgetToColumn,
    reorderWidgetsInColumn,
    isPreviewMode,
    currentLayout,
    addSiteLayoutWidget,
    reorderSiteLayoutWidgets,
  } = usePageBuilder();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand | undefined>(undefined);
  const [widgetDefinitions, setWidgetDefinitions] = useState<WidgetDefinition[]>([]);

  // Sync brandId from URL into auth context
  useEffect(() => {
    if (brandId) {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);

  useEffect(() => {
    const loadData = async () => {
      if (brandId) {
        const [brandData, widgets] = await Promise.all([
          getBrandById(brandId),
          getWidgetDefinitions(brandId),
        ]);
        setBrand(brandData);
        setWidgetDefinitions(widgets);
      }
    };
    loadData();
  }, [brandId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !currentPage) return;

    // If dragging from widget library
    if (active.id.toString().startsWith('library-')) {
      const widgetDefId = active.id.toString().replace('library-', '');
      const widgetDef = widgetDefinitions.find(w => w.id === widgetDefId) || await getWidgetDefinitionById(widgetDefId);
      if (!widgetDef) return;

      // Check if dropped on site layout header/footer
      if (over.id.toString() === 'site-layout-header-drop') {
        addSiteLayoutWidget('header', widgetDefId);
        return;
      }
      if (over.id.toString() === 'site-layout-footer-drop') {
        addSiteLayoutWidget('footer', widgetDefId);
        return;
      }

      // Check if dropped on a column
      if (over.id.toString().startsWith('column-')) {
        const columnId = over.id.toString().replace('column-', '');
        for (const section of currentPage.bodyContent || []) {
          const column = section.columns.find(c => c.id === columnId);
          if (column) {
            addWidget(widgetDefId, widgetDef.defaultConfig, section.id, columnId);
            return;
          }
        }
      } else if (over.id.toString().startsWith('section-')) {
        const sectionId = over.id.toString().replace('section-', '');
        const section = currentPage.bodyContent?.find(s => s.id === sectionId);
        if (section && section.columns.length > 0) {
          addWidget(widgetDefId, widgetDef.defaultConfig, sectionId, section.columns[0].id);
        } else {
          addWidget(widgetDefId, widgetDef.defaultConfig, sectionId);
        }
        return;
      } else {
        addWidget(widgetDefId, widgetDef.defaultConfig);
      }
      return;
    }

    // If moving site layout widget
    if (active.id.toString().startsWith('site-layout-widget-')) {
      const activeId = active.id.toString();
      const overId = over.id.toString();
      
      const activeSection = activeId.includes('-header-') ? 'header' : 'footer';
      const overSection = overId.includes('-header-') ? 'header' : 'footer';
      
      if (activeSection === overSection && overId.startsWith('site-layout-widget-')) {
        reorderSiteLayoutWidgets(activeSection, activeId, overId);
        return;
      }
      return;
    }

    // If moving widget
    if (active.id.toString().startsWith('widget-')) {
      const widgetId = active.id.toString().replace('widget-', '');
      
      let sourceSectionId: string | undefined;
      let sourceColumnId: string | undefined;
      
      for (const section of currentPage.bodyContent || []) {
        for (const column of section.columns) {
          if (column.widgets.some(w => w.id === widgetId)) {
            sourceSectionId = section.id;
            sourceColumnId = column.id;
            break;
          }
        }
        if (sourceSectionId) break;
      }
      
      if (!sourceSectionId || !sourceColumnId) return;

      if (over.id.toString().startsWith('widget-')) {
        const overWidgetId = over.id.toString().replace('widget-', '');
        
        let targetSectionId: string | undefined;
        let targetColumnId: string | undefined;
        let targetPosition: number | undefined;
        
        for (const section of currentPage.bodyContent || []) {
          for (const column of section.columns) {
            const sortedWidgets = [...column.widgets].sort((a, b) => a.order - b.order);
            const targetWidgetIndex = sortedWidgets.findIndex(w => w.id === overWidgetId);
            
            if (targetWidgetIndex !== -1) {
              targetSectionId = section.id;
              targetColumnId = column.id;
              
              if (sourceSectionId === targetSectionId && sourceColumnId === targetColumnId) {
                reorderWidgetsInColumn(section.id, column.id, active.id.toString(), over.id.toString());
                return;
              }
              
              targetPosition = targetWidgetIndex;
              break;
            }
          }
          if (targetSectionId) break;
        }
        
        if (targetSectionId && targetColumnId && targetPosition !== undefined) {
          moveWidgetToColumn(widgetId, targetSectionId, targetColumnId, targetPosition);
          return;
        }
      }
      
      if (over.id.toString().startsWith('column-')) {
        const targetColumnId = over.id.toString().replace('column-', '');
        
        for (const section of currentPage.bodyContent || []) {
          const column = section.columns.find(c => c.id === targetColumnId);
          if (column) {
            moveWidgetToColumn(widgetId, section.id, targetColumnId);
            return;
          }
        }
      }
      
      if (over.id.toString().startsWith('section-')) {
        const targetSectionId = over.id.toString().replace('section-', '');
        const targetSection = currentPage.bodyContent?.find(s => s.id === targetSectionId);
        
        if (targetSection && targetSection.columns.length > 0) {
          moveWidgetToColumn(widgetId, targetSectionId, targetSection.columns[0].id);
          return;
        }
      }
      
      if (over.id.toString() === 'canvas-drop-zone') {
        const bodyContent = currentPage.bodyContent || [];
        if (bodyContent.length > 0) {
          const lastSection = bodyContent[bodyContent.length - 1];
          if (lastSection.columns.length > 0) {
            const lastColumn = lastSection.columns[lastSection.columns.length - 1];
            moveWidgetToColumn(widgetId, lastSection.id, lastColumn.id);
            return;
          }
        }
      }
    }
  };

  const getWidgetName = (id: string) => {
    const widgetDef = widgetDefinitions.find(w => w.id === id.replace('library-', ''));
    return widgetDef?.name || copy.builder.widgetFallbackName;
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <GoogleSitesHeader brand={brand} />
        
        <div className="flex-1 flex overflow-hidden">
          {!isPreviewMode && <WidgetLibraryPanel />}
          <GoogleSitesCanvas />
          {!isPreviewMode && <PropertiesPanel />}
        </div>
      </div>

      <DragOverlay>
        {activeDragId && activeDragId.startsWith('library-') && (
          <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-xl opacity-90">
            <span className="text-sm font-medium">
              {getWidgetName(activeDragId)}
            </span>
          </div>
        )}
        {activeDragId && activeDragId.startsWith('widget-') && (
          <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-xl opacity-90">
            <span className="text-sm font-medium">{copy.builder.widgetFallbackName}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default function BuilderPage() {
  return (
    <PageBuilderProvider>
      <PageBuilderContent />
    </PageBuilderProvider>
  );
}

