// Visibility Rule Evaluator for Data-Driven Widget Rendering
// Evaluates visibility rules to determine if a widget should be shown

import { VisibilityRule } from '@/types/cms';

export interface VisibilityContext {
  device: 'desktop' | 'tablet' | 'mobile';
  isAuthenticated: boolean;
  currentDate: Date;
  urlParams: Record<string, string>;
  userRole?: string;
}

/**
 * Evaluate a single visibility rule
 */
export const evaluateRule = (rule: VisibilityRule, context: VisibilityContext): boolean => {
  switch (rule.type) {
    case 'device':
      // condition: 'equals' | 'not-equals'
      // value: 'desktop' | 'tablet' | 'mobile'
      if (rule.condition === 'equals') {
        return context.device === rule.value;
      } else if (rule.condition === 'not-equals') {
        return context.device !== rule.value;
      }
      return true;

    case 'auth':
      // condition: 'is' | 'is-not'
      // value: 'authenticated' | 'guest'
      if (rule.condition === 'is') {
        return rule.value === 'authenticated' ? context.isAuthenticated : !context.isAuthenticated;
      } else if (rule.condition === 'is-not') {
        return rule.value === 'authenticated' ? !context.isAuthenticated : context.isAuthenticated;
      }
      return true;

    case 'date':
      // condition: 'before' | 'after' | 'between'
      // value: ISO date string or 'start|end' for between
      const now = context.currentDate.getTime();
      if (rule.condition === 'before') {
        return now < new Date(rule.value).getTime();
      } else if (rule.condition === 'after') {
        return now > new Date(rule.value).getTime();
      } else if (rule.condition === 'between') {
        const [start, end] = rule.value.split('|');
        return now >= new Date(start).getTime() && now <= new Date(end).getTime();
      }
      return true;

    case 'url-param':
      // condition: 'equals' | 'not-equals' | 'exists' | 'not-exists'
      // value: 'paramName=expectedValue' or just 'paramName' for exists
      const [paramName, expectedValue] = rule.value.split('=');
      const actualValue = context.urlParams[paramName];
      
      if (rule.condition === 'exists') {
        return actualValue !== undefined;
      } else if (rule.condition === 'not-exists') {
        return actualValue === undefined;
      } else if (rule.condition === 'equals') {
        return actualValue === expectedValue;
      } else if (rule.condition === 'not-equals') {
        return actualValue !== expectedValue;
      }
      return true;

    default:
      return true;
  }
};

/**
 * Evaluate all visibility rules for a widget
 * Returns true if the widget should be visible (all rules pass)
 */
export const evaluateVisibility = (
  rules: VisibilityRule[] | undefined,
  context: VisibilityContext
): boolean => {
  // No rules means always visible
  if (!rules || rules.length === 0) return true;
  
  // All rules must pass for the widget to be visible
  return rules.every(rule => evaluateRule(rule, context));
};

/**
 * Get current visibility context from browser environment
 */
export const getCurrentVisibilityContext = (): VisibilityContext => {
  // Detect device type based on viewport width
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  let device: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (width < 768) device = 'mobile';
  else if (width < 1024) device = 'tablet';
  
  // Parse URL params
  const urlParams: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });
  }
  
  return {
    device,
    isAuthenticated: false, // Would come from auth context in real app
    currentDate: new Date(),
    urlParams,
  };
};
