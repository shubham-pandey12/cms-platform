'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Page, WidgetInstance, WidgetStyles, VisibilityRule } from '@/types/cms';
import { getWidgetDefinitionById, addAuditLog } from '@/services/cmsApiService';
import {
  addWidgetToPage,
  removeWidgetFromPage,
  updateWidgetConfigInPage,
  updateWidgetStylesInPage,
  updateWidgetVersionInPage,
  updateWidgetVisibilityRulesInPage,
  toggleWidgetVisibilityInPage,
  duplicateWidgetInPage,
  moveWidgetUpInPage,
  moveWidgetDownInPage,
  reorderWidgetsInColumnInPage,
  moveWidgetToColumnInPage,
} from './mutations';

export interface UsePageBuilderWidgetsParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  selectedWidgetId: string | null;
  setSelectedWidgetId: (id: string | null) => void;
  userId: string | undefined;
}

export function usePageBuilderWidgets({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
  selectedWidgetId,
  setSelectedWidgetId,
  userId,
}: UsePageBuilderWidgetsParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const addWidget = useCallback(
    async (
      widgetDefinitionId: string,
      config: Record<string, unknown> = {},
      sectionId?: string,
      columnId?: string
    ) => {
      if (!currentPage) return;
      const widgetDef = await getWidgetDefinitionById(widgetDefinitionId);
      const newWidget: WidgetInstance = {
        id: uuidv4(),
        widgetDefinitionId,
        widgetVersion: widgetDef?.version || '1.0.0',
        config,
        styles: {},
        order: 0,
        isVisible: true,
      };
      const updatedPage = addWidgetToPage(currentPage, newWidget, sectionId, columnId);
      await applyAndSync(updatedPage);
      addAuditLog(userId || 'unknown', 'widget.added', 'page', currentPage.id, {
        widgetId: newWidget.id,
        widgetType: widgetDefinitionId,
        widgetVersion: newWidget.widgetVersion,
      });
    },
    [currentPage, applyAndSync, userId]
  );

  const removeWidget = useCallback(
    async (widgetInstanceId: string) => {
      if (!currentPage) return;
      const updatedPage = removeWidgetFromPage(currentPage, widgetInstanceId);
      if (!updatedPage) return;
      await applyAndSync(updatedPage);
      if (selectedWidgetId === widgetInstanceId) setSelectedWidgetId(null);
      addAuditLog(userId || 'unknown', 'widget.removed', 'page', currentPage.id, {
        widgetId: widgetInstanceId,
      });
    },
    [currentPage, applyAndSync, selectedWidgetId, setSelectedWidgetId, userId]
  );

  const updateWidgetConfig = useCallback(
    async (widgetInstanceId: string, config: Record<string, unknown>) => {
      if (!currentPage) return;
      const updatedPage = updateWidgetConfigInPage(currentPage, widgetInstanceId, config);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updateWidgetStyles = useCallback(
    async (widgetInstanceId: string, styles: Partial<WidgetStyles>) => {
      if (!currentPage) return;
      const updatedPage = updateWidgetStylesInPage(currentPage, widgetInstanceId, styles);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updateWidgetVersion = useCallback(
    async (
      widgetInstanceId: string,
      newVersion: string,
      newConfig?: Record<string, unknown>,
      newStyles?: Partial<WidgetStyles>
    ) => {
      if (!currentPage) return;
      const updatedPage = updateWidgetVersionInPage(
        currentPage,
        widgetInstanceId,
        newVersion,
        newConfig,
        newStyles
      );
      if (updatedPage) {
        await applyAndSync(updatedPage);
        addAuditLog(userId || 'unknown', 'widget.version_changed', 'page', currentPage.id, {
          widgetId: widgetInstanceId,
          newVersion,
        });
      }
    },
    [currentPage, applyAndSync, userId]
  );

  const updateWidgetVisibilityRules = useCallback(
    async (widgetInstanceId: string, rules: VisibilityRule[]) => {
      if (!currentPage) return;
      const updatedPage = updateWidgetVisibilityRulesInPage(currentPage, widgetInstanceId, rules);
      if (updatedPage) {
        await applyAndSync(updatedPage);
        addAuditLog(userId || 'unknown', 'widget.visibility_rules_updated', 'page', currentPage.id, {
          widgetId: widgetInstanceId,
          rulesCount: rules.length,
        });
      }
    },
    [currentPage, applyAndSync, userId]
  );

  const duplicateWidget = useCallback(
    async (widgetInstanceId: string) => {
      if (!currentPage) return;
      const bodyContent = currentPage.bodyContent || [];
      for (const section of bodyContent) {
        for (const column of section.columns) {
          const w = column.widgets.find(w => w.id === widgetInstanceId);
          if (w) {
            const newWidget: WidgetInstance = { ...w, id: uuidv4(), order: column.widgets.length };
            const updatedPage = duplicateWidgetInPage(currentPage, widgetInstanceId, newWidget);
            if (updatedPage) {
              await applyAndSync(updatedPage);
              addAuditLog(userId || 'unknown', 'widget.duplicated', 'page', currentPage.id, {
                originalWidgetId: widgetInstanceId,
                newWidgetId: newWidget.id,
              });
            }
            return;
          }
        }
      }
    },
    [currentPage, applyAndSync, userId]
  );

  const toggleWidgetVisibility = useCallback(
    async (widgetInstanceId: string) => {
      if (!currentPage) return;
      const updatedPage = toggleWidgetVisibilityInPage(currentPage, widgetInstanceId);
      if (updatedPage) {
        await applyAndSync(updatedPage);
        const bodyContent = updatedPage.bodyContent || [];
        for (const section of bodyContent) {
          for (const column of section.columns) {
            const w = column.widgets.find(w => w.id === widgetInstanceId);
            if (w) {
              addAuditLog(userId || 'unknown', 'widget.visibility_toggled', 'page', currentPage.id, {
                widgetId: widgetInstanceId,
                isVisible: w.isVisible,
              });
              return;
            }
          }
        }
      }
    },
    [currentPage, applyAndSync, userId]
  );

  const moveWidgetUp = useCallback(
    async (widgetInstanceId: string, sectionId: string, columnId: string) => {
      if (!currentPage) return;
      const updatedPage = moveWidgetUpInPage(currentPage, widgetInstanceId, sectionId, columnId);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const moveWidgetDown = useCallback(
    async (widgetInstanceId: string, sectionId: string, columnId: string) => {
      if (!currentPage) return;
      const updatedPage = moveWidgetDownInPage(currentPage, widgetInstanceId, sectionId, columnId);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const reorderWidgetsInColumn = useCallback(
    async (sectionId: string, columnId: string, activeId: string, overId: string) => {
      if (!currentPage) return;
      const updatedPage = reorderWidgetsInColumnInPage(
        currentPage,
        sectionId,
        columnId,
        activeId,
        overId
      );
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const moveWidgetToColumn = useCallback(
    async (
      widgetId: string,
      targetSectionId: string,
      targetColumnId: string,
      targetPosition?: number
    ) => {
      if (!currentPage) return;
      const updatedPage = moveWidgetToColumnInPage(
        currentPage,
        widgetId,
        targetSectionId,
        targetColumnId,
        targetPosition
      );
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateWidgetStyles,
    updateWidgetVersion,
    updateWidgetVisibilityRules,
    duplicateWidget,
    toggleWidgetVisibility,
    moveWidgetUp,
    moveWidgetDown,
    reorderWidgetsInColumn,
    moveWidgetToColumn,
  };
}
