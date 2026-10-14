/**
 * Widget Variable System
 * Manages automatic variables created by interactive widgets
 * 
 * This system allows widgets (like search boxes) to automatically create
 * and update page variables that can be used by API calls.
 */

import { PageVariable } from '@/types/cms';

export interface WidgetVariable {
  widgetId: string;
  variableName: string;
  value: string;
  updatedAt: Date;
}

// Global store for widget-generated variables
const widgetVariableStore = new Map<string, WidgetVariable>();

/**
 * Set a widget variable
 * @param widgetId - The ID of the widget setting the variable
 * @param variableName - The name of the variable (e.g., 'SEARCH_QUERY')
 * @param value - The value to set
 */
export const setWidgetVariable = (
  widgetId: string,
  variableName: string,
  value: string
): void => {
  const key = `${widgetId}:${variableName}`;
  widgetVariableStore.set(key, {
    widgetId,
    variableName,
    value,
    updatedAt: new Date(),
  });
  
  // Dispatch a custom event so other components can react to variable changes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('widgetVariableChanged', {
        detail: { widgetId, variableName, value },
      })
    );
  }
};

/**
 * Get a specific widget variable
 * @param widgetId - The ID of the widget
 * @param variableName - The name of the variable
 * @returns The value of the variable, or undefined if not found
 */
export const getWidgetVariable = (
  widgetId: string,
  variableName: string
): string | undefined => {
  const key = `${widgetId}:${variableName}`;
  return widgetVariableStore.get(key)?.value;
};

/**
 * Get all widget variables as PageVariable array
 * This can be merged with page-level variables for API calls
 * @returns Array of PageVariable objects
 */
export const getAllWidgetVariables = (): PageVariable[] => {
  return Array.from(widgetVariableStore.values()).map((wv) => ({
    name: wv.variableName,
    value: wv.value,
    source: 'api' as const, // Mark as 'api' source since these are runtime values
  }));
};

/**
 * Clear a specific widget variable
 * @param widgetId - The ID of the widget
 * @param variableName - The name of the variable to clear
 */
export const clearWidgetVariable = (
  widgetId: string,
  variableName: string
): void => {
  const key = `${widgetId}:${variableName}`;
  widgetVariableStore.delete(key);
};

/**
 * Clear all variables for a specific widget
 * @param widgetId - The ID of the widget
 */
export const clearWidgetVariables = (widgetId: string): void => {
  for (const [key] of widgetVariableStore) {
    if (key.startsWith(`${widgetId}:`)) {
      widgetVariableStore.delete(key);
    }
  }
};

/**
 * Clear all widget variables
 */
export const clearAllWidgetVariables = (): void => {
  widgetVariableStore.clear();
};

/**
 * Get all variables for a specific widget
 * @param widgetId - The ID of the widget
 * @returns Array of WidgetVariable objects for this widget
 */
export const getWidgetVariables = (widgetId: string): WidgetVariable[] => {
  const variables: WidgetVariable[] = [];
  for (const [key, value] of widgetVariableStore) {
    if (key.startsWith(`${widgetId}:`)) {
      variables.push(value);
    }
  }
  return variables;
};

/**
 * Check if a variable name is already in use by any widget
 * @param variableName - The variable name to check
 * @returns true if the variable exists
 */
export const hasVariable = (variableName: string): boolean => {
  for (const wv of widgetVariableStore.values()) {
    if (wv.variableName === variableName) {
      return true;
    }
  }
  return false;
};
