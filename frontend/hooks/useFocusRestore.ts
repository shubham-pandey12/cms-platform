import { useEffect, useRef } from 'react';

/**
 * Hook to restore focus to a previously focused element
 * Useful when closing modals or dialogs
 */
export const useFocusRestore = (shouldRestore: boolean) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the currently focused element when component mounts
    if (document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }
  }, []);

  useEffect(() => {
    if (shouldRestore && previousActiveElement.current) {
      // Restore focus after a brief delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
          previousActiveElement.current.focus();
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldRestore]);

  return previousActiveElement;
};
