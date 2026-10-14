'use client';

import { useCallback } from 'react';
import type { Page, DataBinding } from '@/types/cms';
import {
  addDataBindingToPage,
  removeDataBindingFromPage,
  updateDataBindingInPage,
} from './mutations';

export interface UsePageBuilderDataBindingsParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
}

export function usePageBuilderDataBindings({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
}: UsePageBuilderDataBindingsParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const addDataBinding = useCallback(
    async (widgetId: string, binding: DataBinding) => {
      if (!currentPage) return;
      const updatedPage = addDataBindingToPage(currentPage, widgetId, binding);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const removeDataBinding = useCallback(
    async (widgetId: string, bindingId: string) => {
      if (!currentPage) return;
      const updatedPage = removeDataBindingFromPage(currentPage, widgetId, bindingId);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updateDataBinding = useCallback(
    async (widgetId: string, bindingId: string, updates: Partial<DataBinding>) => {
      if (!currentPage) return;
      const updatedPage = updateDataBindingInPage(currentPage, widgetId, bindingId, updates);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    addDataBinding,
    removeDataBinding,
    updateDataBinding,
  };
}
