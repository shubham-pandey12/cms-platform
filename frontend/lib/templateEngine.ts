import { RenderContext } from '@/types/renderTemplate';

/**
 * Template Engine for resolving bindings in widget render templates
 * Supports syntax like {{config.title}}, {{theme.colors.primary}}, {{item.label}}
 */

// Regex to match template bindings: {{path.to.value}}
const BINDING_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Get a nested value from an object using dot notation
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., "config.menuItems.0.label")
 * @returns The value at the path, or undefined if not found
 */
export const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== 'object') return undefined;
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    
    // Handle array index access
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[parseInt(part, 10)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  
  return current;
};

/**
 * Resolve a single binding path against a context
 * @param path - The binding path (without {{ }})
 * @param context - The render context
 * @returns The resolved value
 */
export const resolveBinding = (path: string, context: RenderContext): unknown => {
  const trimmedPath = path.trim();
  
  // Handle special prefixes
  if (trimmedPath.startsWith('config.')) {
    return getNestedValue(context.config, trimmedPath.slice(7));
  }
  
  if (trimmedPath.startsWith('styles.')) {
    return getNestedValue(context.styles, trimmedPath.slice(7));
  }
  
  if (trimmedPath.startsWith('theme.')) {
    return getNestedValue(context.theme, trimmedPath.slice(6));
  }
  
  if (trimmedPath.startsWith('item.')) {
    return getNestedValue(context.item, trimmedPath.slice(5));
  }
  
  if (trimmedPath === 'item') {
    return context.item;
  }
  
  if (trimmedPath === 'index') {
    return context.index;
  }
  
  // Try to resolve from context root
  return getNestedValue(context, trimmedPath);
};

/**
 * Resolve all bindings in a template string
 * @param template - String with {{binding}} syntax
 * @param context - The render context
 * @returns Resolved string with all bindings replaced
 */
export const resolveTemplateString = (template: string, context: RenderContext): string => {
  if (!template || typeof template !== 'string') return template || '';
  
  return template.replace(BINDING_REGEX, (_, path) => {
    const value = resolveBinding(path, context);
    return value !== undefined && value !== null ? String(value) : '';
  });
};

/**
 * Resolve a template value that could be a string with bindings or a direct value
 * @param value - The value to resolve (could be a template string or any value)
 * @param context - The render context
 * @returns The resolved value
 */
export const resolveValue = (value: unknown, context: RenderContext): unknown => {
  if (typeof value === 'string') {
    // Check if the entire string is a single binding (for non-string values)
    const singleBindingMatch = value.match(/^\{\{([^}]+)\}\}$/);
    if (singleBindingMatch) {
      return resolveBinding(singleBindingMatch[1], context);
    }
    // Otherwise, resolve as template string
    return resolveTemplateString(value, context);
  }
  return value;
};

/**
 * Resolve a style object with template bindings
 * @param style - Object with style properties that may contain bindings
 * @param context - The render context
 * @returns Style object with all bindings resolved
 */
export const resolveStyles = (
  style: Record<string, string | number> | undefined,
  context: RenderContext
): React.CSSProperties => {
  if (!style) return {};
  
  const resolved: Record<string, string | number> = {};
  
  for (const [key, value] of Object.entries(style)) {
    const resolvedValue = resolveValue(value, context);
    if (resolvedValue !== undefined && resolvedValue !== null && resolvedValue !== '') {
      resolved[key] = resolvedValue as string | number;
    }
  }
  
  return resolved as React.CSSProperties;
};

/**
 * Evaluate a condition binding
 * @param condition - Condition template (e.g., "{{config.showCta}}")
 * @param context - The render context
 * @returns Boolean indicating if condition is truthy
 */
export const evaluateCondition = (condition: string | undefined, context: RenderContext): boolean => {
  if (!condition) return true;
  
  const value = resolveValue(condition, context);
  
  // Handle various truthy/falsy values
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 0 && value !== 'false';
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  
  return Boolean(value);
};

/**
 * Get items for a repeat binding
 * @param repeat - Repeat template (e.g., "{{config.menuItems}}")
 * @param context - The render context
 * @returns Array of items to iterate over
 */
export const getRepeatItems = (repeat: string, context: RenderContext): unknown[] => {
  const value = resolveValue(repeat, context);
  
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) return Object.values(value);
  
  return [];
};
