import type { Condition, CompoundCondition, SimpleCondition } from '@/types/cms';
// Lazy import to avoid circular deps; registry is only accessed when a custom op is encountered
let registryCache: typeof import('@/lib/widgetPropertyRegistry').widgetPropertyRegistry | undefined;
function getRegistry() {
  if (!registryCache && typeof window !== 'undefined') {
    // Dynamic require to avoid server-side circular dep issues
    try {
      registryCache = require('@/lib/widgetPropertyRegistry').widgetPropertyRegistry;
    } catch {
      // Non-critical; registry is optional
    }
  }
  return registryCache;
}

type ConfigRecord = Record<string, unknown>;

function isCompound(c: Condition): c is CompoundCondition {
  return 'all' in c || 'any' in c;
}

/** Evaluate a single leaf condition against the widget config. */
function evalSimple(cond: SimpleCondition, config: ConfigRecord): boolean {
  const lhs = config[cond.field];
  const rhs = cond.value;

  switch (cond.op) {
    case 'truthy':
      return Boolean(lhs) && lhs !== '' && lhs !== null && lhs !== undefined;
    case 'falsy':
      return !lhs || lhs === '' || lhs === null || lhs === undefined;
    case 'eq':
      return lhs === rhs;
    case 'neq':
      return lhs !== rhs;
    case 'in':
      return Array.isArray(rhs) && rhs.includes(lhs);
    case 'nin':
      return Array.isArray(rhs) && !rhs.includes(lhs);
    case 'gt':
      return typeof lhs === 'number' && typeof rhs === 'number' && lhs > rhs;
    case 'lt':
      return typeof lhs === 'number' && typeof rhs === 'number' && lhs < rhs;
    case 'regex':
      if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
      try {
        return new RegExp(rhs).test(lhs);
      } catch {
        return false;
      }
    default: {
      // Check plugin registry for custom operators
      const customFn = getRegistry()?.getConditionOperator(cond.op);
      if (customFn) return customFn(lhs, rhs, config);
      return false;
    }
  }
}

/**
 * Evaluate a Condition tree against a widget config object.
 * Returns true if the condition is satisfied.
 *
 * Used by PropertiesContentTab to determine field visibility and disabled state.
 * Custom operators can be registered via widgetPropertyRegistry.registerConditionOperator.
 */
export function evaluateCondition(condition: Condition | undefined, config: ConfigRecord): boolean {
  if (!condition) return true;

  if (isCompound(condition)) {
    if ('all' in condition && condition.all) {
      return condition.all.every((c) => evaluateCondition(c, config));
    }
    if ('any' in condition && condition.any) {
      return condition.any.some((c) => evaluateCondition(c, config));
    }
    return true;
  }

  return evalSimple(condition as SimpleCondition, config);
}
