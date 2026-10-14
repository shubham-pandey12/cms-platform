'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Page, PageSection } from '@/types/cms';
import {
  addSectionToPage,
  removeSectionFromPage,
  updateSectionLayoutInPage,
  updateSectionStylesInPage,
  moveSectionInPage,
} from './mutations';

export interface UsePageBuilderSectionsParams {
  currentPage: Page | null;
  setCurrentPageState: (page: Page | null) => void;
  pushToHistory: (page: Page) => void;
  syncPageToApi: (page: Page) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
}

export function usePageBuilderSections({
  currentPage,
  setCurrentPageState,
  pushToHistory,
  syncPageToApi,
  setIsDirty,
  selectedSectionId,
  setSelectedSectionId,
}: UsePageBuilderSectionsParams) {
  const applyAndSync = useCallback(
    async (updatedPage: Page) => {
      setCurrentPageState(updatedPage);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [setCurrentPageState, pushToHistory, setIsDirty]
  );

  const addSection = useCallback(
    async (layout: string = '1-col', afterSectionId?: string) => {
      if (!currentPage) return;
      const newSection: PageSection = {
        id: uuidv4(),
        type: 'section',
        layout: layout as PageSection['layout'],
        styles: {},
        columns: [{
          id: uuidv4(),
          span: { mobile: 12, tablet: 12, desktop: 12 },
          widgets: [],
        }],
      };
      const updatedPage = addSectionToPage(currentPage, newSection, afterSectionId);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const removeSection = useCallback(
    async (sectionId: string) => {
      if (!currentPage) return;
      const updatedPage = removeSectionFromPage(currentPage, sectionId);
      await applyAndSync(updatedPage);
      if (selectedSectionId === sectionId) setSelectedSectionId(null);
    },
    [currentPage, applyAndSync, selectedSectionId, setSelectedSectionId]
  );

  const updateSectionLayout = useCallback(
    async (sectionId: string, layout: PageSection['layout']) => {
      if (!currentPage) return;
      const updatedPage = updateSectionLayoutInPage(currentPage, sectionId, layout);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const updateSectionStyles = useCallback(
    async (sectionId: string, styles: Partial<PageSection['styles']>) => {
      if (!currentPage) return;
      const updatedPage = updateSectionStylesInPage(currentPage, sectionId, styles);
      await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  const moveSection = useCallback(
    async (sectionId: string, targetIndex: number) => {
      if (!currentPage) return;
      const updatedPage = moveSectionInPage(currentPage, sectionId, targetIndex);
      if (updatedPage) await applyAndSync(updatedPage);
    },
    [currentPage, applyAndSync]
  );

  return {
    addSection,
    removeSection,
    updateSectionLayout,
    updateSectionStyles,
    moveSection,
  };
}
