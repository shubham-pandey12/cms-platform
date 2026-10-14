'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Page, ResponsiveSpan, WidgetInstance } from '@/types/cms';
import {
  addColumnToPage,
  removeColumnFromPage,
  updateColumnSpanInPage,
} from './mutations';

export interface UsePageBuilderColumnsParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  selectedColumnId: string | null;
  setSelectedColumnId: (id: string | null) => void;
}

export function usePageBuilderColumns({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
  selectedColumnId,
  setSelectedColumnId,
}: UsePageBuilderColumnsParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const addColumn = useCallback(
    async (sectionId: string, span?: ResponsiveSpan) => {
      if (!currentPage) return;
      const defaultSpan: ResponsiveSpan = span || { mobile: 12, tablet: 6, desktop: 6 };
      const newColumn: { id: string; span: ResponsiveSpan; widgets: WidgetInstance[] } = {
        id: uuidv4(),
        span: defaultSpan,
        widgets: [],
      };
      const updatedPage = addColumnToPage(currentPage, sectionId, newColumn);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const removeColumn = useCallback(
    async (sectionId: string, columnId: string) => {
      if (!currentPage) return;
      const updatedPage = removeColumnFromPage(currentPage, sectionId, columnId);
      await applyAndSync(updatedPage);
      if (selectedColumnId === columnId) setSelectedColumnId(null);
    },
    [currentPage, applyAndSync, selectedColumnId, setSelectedColumnId]
  );

  const updateColumnSpan = useCallback(
    async (sectionId: string, columnId: string, span: ResponsiveSpan) => {
      if (!currentPage) return;
      const updatedPage = updateColumnSpanInPage(currentPage, sectionId, columnId, span);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    addColumn,
    removeColumn,
    updateColumnSpan,
  };
}
