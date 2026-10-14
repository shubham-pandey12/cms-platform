'use client';

import { useCallback } from 'react';
import type { Page, Action } from '@/types/cms';
import {
  addActionToPage,
  removeActionFromPage,
  updateActionInPage,
} from './mutations';

export interface UsePageBuilderActionsParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
}

export function usePageBuilderActions({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
}: UsePageBuilderActionsParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const addAction = useCallback(
    async (widgetId: string, actionName: string, action: Action) => {
      if (!currentPage) return;
      const updatedPage = addActionToPage(currentPage, widgetId, actionName, action);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const removeAction = useCallback(
    async (widgetId: string, actionName: string) => {
      if (!currentPage) return;
      const updatedPage = removeActionFromPage(currentPage, widgetId, actionName);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updateAction = useCallback(
    async (widgetId: string, actionName: string, updates: Partial<Action>) => {
      if (!currentPage) return;
      const updatedPage = updateActionInPage(currentPage, widgetId, actionName, updates);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    addAction,
    removeAction,
    updateAction,
  };
}
