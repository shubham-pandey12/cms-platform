/**
 * Accessibility utility functions
 * Provides helpers for focus management, screen reader announcements, and keyboard navigation
 */

/**
 * Announce a message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
};

/**
 * Get the first focusable element in a container
 */
export const getFirstFocusable = (container: HTMLElement): HTMLElement | null => {
  const focusable = getFocusableElements(container);
  return focusable.length > 0 ? focusable[0] : null;
};

/**
 * Get the last focusable element in a container
 */
export const getLastFocusable = (container: HTMLElement): HTMLElement | null => {
  const focusable = getFocusableElements(container);
  return focusable.length > 0 ? focusable[focusable.length - 1] : null;
};

/**
 * Focus the first focusable element in a container
 */
export const focusFirst = (container: HTMLElement): void => {
  const first = getFirstFocusable(container);
  if (first) {
    first.focus();
  }
};

/**
 * Focus the last focusable element in a container
 */
export const focusLast = (container: HTMLElement): void => {
  const last = getLastFocusable(container);
  if (last) {
    last.focus();
  }
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusable = getFocusableElements(document.body);
  return focusable.includes(element);
};

/**
 * Create a live region for dynamic announcements
 */
export const createLiveRegion = (id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
  let region = document.getElementById(id) as HTMLElement;
  
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  
  return region;
};

/**
 * Update a live region with new content
 */
export const updateLiveRegion = (id: string, message: string): void => {
  const region = createLiveRegion(id);
  region.textContent = message;
};

/**
 * Handle keyboard navigation for arrow keys
 */
export const handleArrowKeyNavigation = (
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number | null => {
  const isHorizontal = orientation === 'horizontal';
  const isVertical = orientation === 'vertical';
  
  let newIndex: number | null = null;
  
  if (isHorizontal) {
    if (event.key === 'ArrowLeft') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (event.key === 'ArrowRight') {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    }
  } else if (isVertical) {
    if (event.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (event.key === 'ArrowDown') {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    }
  }
  
  if (newIndex !== null && items[newIndex]) {
    items[newIndex].focus();
    event.preventDefault();
    return newIndex;
  }
  
  return null;
};

/**
 * Check if element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  const ariaHidden = element.getAttribute('aria-hidden');
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    ariaHidden !== 'true'
  );
};

/**
 * Get accessible name for an element
 */
export const getAccessibleName = (element: HTMLElement): string => {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }
  
  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }
  
  // Fallback to text content
  return element.textContent || '';
};
