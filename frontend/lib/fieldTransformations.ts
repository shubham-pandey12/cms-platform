/**
 * Field Transformations Library
 * 
 * Provides data transformation functions for field mapping
 */

import { evaluateSafeExpression } from './safeExpressionEvaluator';

export type TransformationType = 
  | 'format_date'
  | 'format_number'
  | 'format_currency'
  | 'concatenate'
  | 'substring'
  | 'uppercase'
  | 'lowercase'
  | 'default_value'
  | 'custom';

export interface TransformationConfig {
  type: TransformationType;
  params?: Record<string, unknown>;
  customFunction?: string;
}

export interface TransformationDefinition {
  id: TransformationType;
  name: string;
  description: string;
  params: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    label: string;
    placeholder?: string;
    defaultValue?: unknown;
  }[];
  preview: (value: unknown, params: Record<string, unknown>) => string;
}

/**
 * Built-in transformation definitions
 */
export const TRANSFORMATION_DEFINITIONS: TransformationDefinition[] = [
  {
    id: 'format_date',
    name: 'Format Date',
    description: 'Format date strings into human-readable format',
    params: [
      {
        name: 'format',
        type: 'string',
        label: 'Format',
        placeholder: 'MMMM DD, YYYY',
        defaultValue: 'MMMM DD, YYYY',
      },
    ],
    preview: (value, params) => {
      if (typeof value === 'string' || value instanceof Date) {
        const date = new Date(value);
        // Simple formatting - in production would use date-fns or similar
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return String(value);
    },
  },
  {
    id: 'format_number',
    name: 'Format Number',
    description: 'Format numbers with decimals and thousands separators',
    params: [
      {
        name: 'decimals',
        type: 'number',
        label: 'Decimal Places',
        defaultValue: 2,
      },
    ],
    preview: (value, params) => {
      if (typeof value === 'number') {
        const decimals = (params.decimals as number) || 2;
        return value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      return String(value);
    },
  },
  {
    id: 'format_currency',
    name: 'Format Currency',
    description: 'Format numbers as currency with symbol',
    params: [
      {
        name: 'currency',
        type: 'string',
        label: 'Currency Code',
        placeholder: 'USD',
        defaultValue: 'USD',
      },
    ],
    preview: (value, params) => {
      if (typeof value === 'number') {
        const currency = (params.currency as string) || 'USD';
        return value.toLocaleString(undefined, {
          style: 'currency',
          currency,
        });
      }
      return String(value);
    },
  },
  {
    id: 'concatenate',
    name: 'Concatenate',
    description: 'Join multiple values with a separator',
    params: [
      {
        name: 'separator',
        type: 'string',
        label: 'Separator',
        placeholder: ' ',
        defaultValue: ' ',
      },
    ],
    preview: (value, params) => {
      if (Array.isArray(value)) {
        const separator = (params.separator as string) || ' ';
        return value.join(separator);
      }
      return String(value);
    },
  },
  {
    id: 'substring',
    name: 'Substring / Truncate',
    description: 'Extract a portion of text or truncate',
    params: [
      {
        name: 'start',
        type: 'number',
        label: 'Start Position',
        defaultValue: 0,
      },
      {
        name: 'end',
        type: 'number',
        label: 'End Position (optional)',
      },
    ],
    preview: (value, params) => {
      if (typeof value === 'string') {
        const start = (params.start as number) || 0;
        const end = params.end as number | undefined;
        const result = end !== undefined ? value.substring(start, end) : value.substring(start);
        return end !== undefined && result.length < value.length ? result + '...' : result;
      }
      return String(value);
    },
  },
  {
    id: 'uppercase',
    name: 'Uppercase',
    description: 'Convert text to uppercase',
    params: [],
    preview: (value) => {
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      return String(value);
    },
  },
  {
    id: 'lowercase',
    name: 'Lowercase',
    description: 'Convert text to lowercase',
    params: [],
    preview: (value) => {
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
      return String(value);
    },
  },
  {
    id: 'default_value',
    name: 'Default Value',
    description: 'Provide a fallback value if null or undefined',
    params: [
      {
        name: 'defaultValue',
        type: 'string',
        label: 'Default Value',
        placeholder: 'N/A',
      },
    ],
    preview: (value, params) => {
      if (value === null || value === undefined) {
        return String(params.defaultValue || 'N/A');
      }
      return String(value);
    },
  },
  {
    id: 'custom',
    name: 'Custom Function',
    description: 'Write a custom JavaScript expression',
    params: [
      {
        name: 'expression',
        type: 'string',
        label: 'Expression',
        placeholder: 'value * 1.1',
      },
    ],
    preview: (value, params) => {
      try {
        const expression = params.expression as string;
        if (!expression) return String(value);
        
        // Use safe expression evaluator to prevent arbitrary code execution
        const result = evaluateSafeExpression(expression, value);
        return String(result);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Invalid expression'}`;
      }
    },
  },
];

/**
 * Apply a transformation to a value
 */
export const applyTransformation = (
  value: unknown,
  config: TransformationConfig
): unknown => {
  const definition = TRANSFORMATION_DEFINITIONS.find(d => d.id === config.type);
  if (!definition) return value;

  try {
    const params = config.params || {};
    
    // Use the preview function which already implements the transformation
    return definition.preview(value, params);
  } catch (error) {
    console.error(`Error applying transformation ${config.type}:`, error);
    return value;
  }
};

/**
 * Chain multiple transformations
 */
export const applyTransformationChain = (
  value: unknown,
  transformations: TransformationConfig[]
): unknown => {
  let result = value;
  
  for (const transformation of transformations) {
    result = applyTransformation(result, transformation);
  }
  
  return result;
};

/**
 * Get transformation definition by ID
 */
export const getTransformationDefinition = (
  type: TransformationType
): TransformationDefinition | undefined => {
  return TRANSFORMATION_DEFINITIONS.find(d => d.id === type);
};

/**
 * Validate transformation configuration
 */
export const validateTransformation = (
  config: TransformationConfig
): { valid: boolean; error?: string } => {
  const definition = getTransformationDefinition(config.type);
  
  if (!definition) {
    return { valid: false, error: `Unknown transformation type: ${config.type}` };
  }

  // Check required params
  for (const paramDef of definition.params) {
    if (paramDef.defaultValue === undefined && !config.params?.[paramDef.name]) {
      return { valid: false, error: `Missing required parameter: ${paramDef.label}` };
    }
  }

  return { valid: true };
};
