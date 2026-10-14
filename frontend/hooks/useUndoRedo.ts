import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions<T> {
  maxHistory?: number;
}

export function useUndoRedo<T>(initialState: T, options: UseUndoRedoOptions<T> = {}) {
  const { maxHistory = 50 } = options;
  
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Use ref to track current index for synchronous access
  const currentIndexRef = useRef(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const current = history[currentIndex];

  const push = useCallback((state: T) => {
    setHistory(prev => {
      const prevIndex = currentIndexRef.current;
      // Remove future history if we're not at the end
      const newHistory = prev.slice(0, prevIndex + 1);
      newHistory.push(state);
      
      let newIndex = prevIndex + 1;
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        // Adjust index when history is shifted
        newIndex = Math.max(0, newIndex - 1);
      }
      
      // Update index ref and state
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      
      return newHistory;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return current;
  }, [canUndo, currentIndex, history, current]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return current;
  }, [canRedo, currentIndex, history, current]);

  const reset = useCallback((state: T) => {
    setHistory([state]);
    currentIndexRef.current = 0;
    setCurrentIndex(0);
  }, []);

  return {
    current,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    historyLength: history.length,
  };
}
