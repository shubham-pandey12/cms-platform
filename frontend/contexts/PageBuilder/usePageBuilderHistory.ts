'use client';

import { useState, useCallback } from 'react';
import type { Page } from '@/types/cms';
import { deepClone } from '@/lib/deepClone';

export interface PageBuilderHistoryApi {
  pushToHistory: (page: Page) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  resetHistory: (page: Page | null) => void;
}

/**
 * Undo/redo state and actions for the page builder.
 * Undo/redo only update local state and do not sync to the API.
 * Callers may pass setIsDirty to mark the page unsaved after undo/redo.
 * Call resetHistory when loading or switching page.
 */
export function usePageBuilderHistory(
  setCurrentPageState: (page: Page | null) => void,
  setIsDirty?: (dirty: boolean) => void
): PageBuilderHistoryApi {
  const [history, setHistory] = useState<Page[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushToHistory = useCallback((page: Page) => {
    setHistoryIndex(prevIndex => {
      setHistory(prev => {
        const newHistory = prev.slice(0, prevIndex + 1);
        return [...newHistory, deepClone(page)];
      });
      return prevIndex + 1;
    });
  }, []);

  const undo = useCallback(async () => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const restoredPage = deepClone(history[newIndex]);
    setCurrentPageState(restoredPage);
    setIsDirty?.(true);
  }, [canUndo, historyIndex, history, setCurrentPageState, setIsDirty]);

  const redo = useCallback(async () => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const restoredPage = deepClone(history[newIndex]);
    setCurrentPageState(restoredPage);
    setIsDirty?.(true);
  }, [canRedo, historyIndex, history, setCurrentPageState, setIsDirty]);

  const resetHistory = useCallback((page: Page | null) => {
    if (page) {
      setHistory([deepClone(page)]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, []);

  return {
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
