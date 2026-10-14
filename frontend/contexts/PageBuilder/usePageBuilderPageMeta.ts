'use client';

import { useCallback } from 'react';
import type { Page, PageLayoutConfig } from '@/types/cms';
import {
  updatePageLayoutConfigInPage,
  updatePageCssInPage,
  updatePageSeoInPage,
  updatePageNameInPage,
  updatePageUriInPage,
  updatePageStatusInPage,
  updatePageDynamicVariablesInPage,
} from './mutations';

export interface UsePageBuilderPageMetaParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
}

export function usePageBuilderPageMeta({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
}: UsePageBuilderPageMetaParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const updatePageLayoutConfig = useCallback(
    async (layoutConfig: PageLayoutConfig) => {
      if (!currentPage) return;
      const updatedPage = updatePageLayoutConfigInPage(currentPage, layoutConfig);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageCss = useCallback(
    async (customCss: string) => {
      if (!currentPage) return;
      const updatedPage = updatePageCssInPage(currentPage, customCss);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageSeo = useCallback(
    async (seoUpdates: Partial<Page['seo']>) => {
      if (!currentPage) return;
      const updatedPage = updatePageSeoInPage(currentPage, seoUpdates);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageName = useCallback(
    async (name: string) => {
      if (!currentPage) return;
      const updatedPage = updatePageNameInPage(currentPage, name);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageUri = useCallback(
    async (uri: string) => {
      if (!currentPage) return;
      const updatedPage = updatePageUriInPage(currentPage, uri);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageStatus = useCallback(
    async (status: Page['status']) => {
      if (!currentPage) return;
      const updatedPage = updatePageStatusInPage(currentPage, status);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updatePageDynamicVariables = useCallback(
    async (variables: string[]) => {
      if (!currentPage) return;
      const updatedPage = updatePageDynamicVariablesInPage(currentPage, variables);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    updatePageLayoutConfig,
    updatePageCss,
    updatePageSeo,
    updatePageName,
    updatePageUri,
    updatePageStatus,
    updatePageDynamicVariables,
  };
}
