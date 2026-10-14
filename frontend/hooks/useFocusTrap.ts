import { useEffect, useRef, RefObject } from 'react';
import { getFocusableElements, getFirstFocusable, getLastFocusable } from '@/lib/accessibility';

/**
 * Hook to trap focus within a container element
 * Useful for modals, dialogs, and dropdowns
 */
export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  options: {
    initialFocus?: RefObject<HTMLElement>;
    returnFocus?: boolean;
  } = {}
): RefObject<T> => {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { initialFocus, returnFocus = true } = options;

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable element
    const focusTarget = initialFocus?.current || getFirstFocusable(containerRef.current);
    if (focusTarget) {
      focusTarget.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current);
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      // If Shift+Tab on first element, move to last
      if (event.shiftKey && currentElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // If Tab on last element, move to first
      if (!event.shiftKey && currentElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, initialFocus, returnFocus]);

  return containerRef;
};
