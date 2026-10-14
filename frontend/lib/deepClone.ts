/**
 * Deep Clone Utility
 * 
 * Provides safe deep cloning that handles:
 * - Circular references
 * - Special object types (Date, Map, Set, etc.)
 * - Large objects efficiently
 */

/**
 * Check if structuredClone is available (modern browsers)
 */
const hasStructuredClone = typeof structuredClone !== 'undefined';

/**
 * Deep clone an object using the best available method
 * Falls back to JSON serialization if structuredClone is not available
 * 
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Use structuredClone if available (handles circular refs and special types)
  if (hasStructuredClone) {
    try {
      return structuredClone(obj);
    } catch (error) {
      // If structuredClone fails (e.g., function properties), fall back to custom implementation
      console.warn('structuredClone failed, using fallback:', error);
    }
  }

  // Fallback: Handle special types manually
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    const clonedMap = new Map();
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key), deepClone(value));
    });
    return clonedMap as unknown as T;
  }

  if (obj instanceof Set) {
    const clonedSet = new Set();
    obj.forEach((value) => {
      clonedSet.add(deepClone(value));
    });
    return clonedSet as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  // For plain objects, use JSON serialization with circular reference detection
  const seen = new WeakMap();
  
  function cloneObject(source: unknown): unknown {
    if (source === null || typeof source !== 'object') {
      return source;
    }

    // Check for circular references
    if (seen.has(source)) {
      return seen.get(source);
    }

    if (Array.isArray(source)) {
      const cloned: unknown[] = [];
      seen.set(source, cloned);
      for (let i = 0; i < source.length; i++) {
        cloned[i] = cloneObject(source[i]);
      }
      return cloned;
    }

    if (source instanceof Date) {
      return new Date(source.getTime());
    }

    if (source instanceof RegExp) {
      return new RegExp(source.source, source.flags);
    }

    if (source instanceof Map) {
      const clonedMap = new Map();
      seen.set(source, clonedMap);
      source.forEach((value, key) => {
        clonedMap.set(cloneObject(key), cloneObject(value));
      });
      return clonedMap;
    }

    if (source instanceof Set) {
      const clonedSet = new Set();
      seen.set(source, clonedSet);
      source.forEach((value) => {
        clonedSet.add(cloneObject(value));
      });
      return clonedSet;
    }

    // Plain object
    const cloned: Record<string, unknown> = {};
    seen.set(source, cloned);
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        cloned[key] = cloneObject((source as Record<string, unknown>)[key]);
      }
    }
    return cloned;
  }

  try {
    return cloneObject(obj) as T;
  } catch (error) {
    // Final fallback: JSON serialization (loses functions, undefined, symbols)
    console.warn('Deep clone failed, using JSON fallback:', error);
    try {
      return JSON.parse(JSON.stringify(obj)) as T;
    } catch (jsonError) {
      console.error('JSON clone also failed:', jsonError);
      // Return original if all methods fail (shouldn't happen)
      return obj;
    }
  }
}
