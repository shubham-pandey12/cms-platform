/**
 * Auto-Mapping Engine
 * 
 * Intelligent field name matching algorithm for automatic field mapping
 */

export interface FieldMatch {
  apiPath: string;
  widgetField: string;
  confidence: number; // 0-100
  reason: string;
  apiValue?: unknown;
  dataType?: string;
}

export interface ApiField {
  path: string;
  value: unknown;
  type: string;
}

/**
 * Common field name aliases
 */
const FIELD_ALIASES: Record<string, string[]> = {
  title: ['name', 'heading', 'header', 'label'],
  description: ['text', 'content', 'body', 'summary', 'excerpt'],
  imageUrl: ['image', 'img', 'picture', 'photo', 'thumbnail', 'img_url', 'image_url', 'src'],
  url: ['link', 'href', 'path'],
  price: ['cost', 'amount', 'value'],
  date: ['created_at', 'updated_at', 'published_at', 'timestamp', 'time'],
  author: ['user', 'creator', 'owner', 'by'],
  category: ['type', 'tag', 'group'],
  rating: ['score', 'stars', 'reviews'],
};

/**
 * Convert string to normalized form for comparison
 */
const normalizeFieldName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[_-]/g, '') // Remove underscores and dashes
    .replace(/url$/i, '') // Remove URL suffix
    .replace(/^(get|set|is|has)/, '') // Remove common prefixes
    .trim();
};

/**
 * Convert snake_case or kebab-case to camelCase
 */
const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Extract all field paths from an API response
 */
export const extractApiFields = (
  obj: unknown,
  prefix = '',
  maxDepth = 5,
  currentDepth = 0
): ApiField[] => {
  const fields: ApiField[] = [];

  if (currentDepth > maxDepth) return fields;

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      // For arrays, extract fields from first item
      if (obj.length > 0) {
        const firstItemFields = extractApiFields(
          obj[0],
          prefix ? `${prefix}[0]` : '[0]',
          maxDepth,
          currentDepth + 1
        );
        fields.push(...firstItemFields);
      }
    } else {
      // For objects, extract all properties
      Object.entries(obj).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        const type = Array.isArray(value) ? 'array' : typeof value;

        // Add this field
        fields.push({ path, value, type });

        // Recursively extract nested fields
        if (typeof value === 'object' && value !== null) {
          const nestedFields = extractApiFields(value, path, maxDepth, currentDepth + 1);
          fields.push(...nestedFields);
        }
      });
    }
  }

  return fields;
};

/**
 * Calculate confidence score for a field match
 */
const calculateMatchConfidence = (
  apiFieldName: string,
  widgetFieldName: string,
  apiValue: unknown,
  apiType: string
): { confidence: number; reason: string } => {
  const normalizedApi = normalizeFieldName(apiFieldName);
  const normalizedWidget = normalizeFieldName(widgetFieldName);

  // Exact match (after normalization)
  if (normalizedApi === normalizedWidget) {
    return { confidence: 100, reason: 'Exact name match' };
  }

  // Case-insensitive exact match
  if (apiFieldName.toLowerCase() === widgetFieldName.toLowerCase()) {
    return { confidence: 95, reason: 'Case-insensitive match' };
  }

  // CamelCase/snake_case conversion match
  const apiCamelCase = toCamelCase(apiFieldName);
  const widgetCamelCase = toCamelCase(widgetFieldName);
  if (apiCamelCase === widgetCamelCase) {
    return { confidence: 90, reason: 'Case style conversion match' };
  }

  // Check aliases
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    const apiMatchesCanonical = normalizedApi === canonical || aliases.includes(normalizedApi);
    const widgetMatchesCanonical = normalizedWidget === canonical || aliases.includes(normalizedWidget);
    
    if (apiMatchesCanonical && widgetMatchesCanonical) {
      return { confidence: 85, reason: `Semantic match via "${canonical}"` };
    }
  }

  // Partial match - one contains the other
  if (normalizedApi.includes(normalizedWidget) || normalizedWidget.includes(normalizedApi)) {
    return { confidence: 70, reason: 'Partial name match' };
  }

  // Type-based matching as fallback
  const isStringField = apiType === 'string' && widgetFieldName.toLowerCase().includes('text');
  const isNumberField = apiType === 'number' && (
    widgetFieldName.toLowerCase().includes('price') ||
    widgetFieldName.toLowerCase().includes('count') ||
    widgetFieldName.toLowerCase().includes('amount')
  );
  const isImageField = typeof apiValue === 'string' && 
    String(apiValue).match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) &&
    widgetFieldName.toLowerCase().includes('image');

  if (isStringField || isNumberField || isImageField) {
    return { confidence: 50, reason: 'Type-based match' };
  }

  return { confidence: 0, reason: 'No match' };
};

/**
 * Suggest field mappings based on API response and widget fields
 */
export const suggestMappings = (
  apiResponse: unknown,
  widgetFields: string[],
  minConfidence = 60
): FieldMatch[] => {
  const apiFields = extractApiFields(apiResponse);
  const suggestions: FieldMatch[] = [];

  // For each widget field, find the best matching API field
  for (const widgetField of widgetFields) {
    let bestMatch: FieldMatch | null = null;

    for (const apiField of apiFields) {
      // Extract the field name (last part of the path)
      const apiFieldName = apiField.path.split('.').pop()?.replace(/\[\d+\]/, '') || apiField.path;
      
      const { confidence, reason } = calculateMatchConfidence(
        apiFieldName,
        widgetField,
        apiField.value,
        apiField.type
      );

      if (confidence >= minConfidence && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          apiPath: apiField.path,
          widgetField,
          confidence,
          reason,
          apiValue: apiField.value,
          dataType: apiField.type,
        };
      }
    }

    if (bestMatch) {
      suggestions.push(bestMatch);
    }
  }

  // Sort by confidence (descending)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Auto-map fields above a confidence threshold
 */
export const autoMapFields = (
  apiResponse: unknown,
  widgetFields: string[],
  minConfidence = 80
): Map<string, string> => {
  const suggestions = suggestMappings(apiResponse, widgetFields, minConfidence);
  const mappings = new Map<string, string>();

  for (const suggestion of suggestions) {
    mappings.set(suggestion.widgetField, suggestion.apiPath);
  }

  return mappings;
};

/**
 * Validate that a mapping path exists in the API response
 */
export const validateMapping = (
  apiPath: string,
  apiResponse: unknown
): { valid: boolean; value?: unknown; error?: string } => {
  try {
    // Navigate the path
    const parts = apiPath.split('.').map(part => part.replace(/\[(\d+)\]/, '.$1')).join('.').split('.');
    let current: any = apiResponse;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return { valid: false, error: 'Path leads to null or undefined' };
      }

      if (part.match(/^\d+$/)) {
        // Array index
        const index = parseInt(part);
        if (!Array.isArray(current)) {
          return { valid: false, error: `Expected array but got ${typeof current}` };
        }
        if (index < 0 || index >= current.length) {
          return { valid: false, error: `Array index ${index} out of bounds (length: ${current.length})` };
        }
        current = current[index];
      } else {
        // Object property
        if (typeof current !== 'object') {
          return { valid: false, error: `Expected object but got ${typeof current}` };
        }
        if (!(part in current)) {
          return { valid: false, error: `Property "${part}" not found` };
        }
        current = current[part];
      }
    }

    return { valid: true, value: current };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get sample value from API response for preview
 */
export const getSampleValue = (apiResponse: unknown, apiPath: string): unknown => {
  const validation = validateMapping(apiPath, apiResponse);
  return validation.valid ? validation.value : null;
};
