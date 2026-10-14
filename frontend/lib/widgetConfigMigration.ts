import type { WidgetConfigSchema, WidgetConfigField } from '@/types/cms';

/**
 * Migrates widget configuration from one schema version to another.
 * Preserves existing values for fields that exist in both schemas,
 * and applies defaults for new fields.
 */
export function migrateWidgetConfig(
  oldConfig: Record<string, unknown>,
  oldSchema: WidgetConfigSchema,
  newSchema: WidgetConfigSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const oldFieldNames = new Set(oldSchema.fields.map((f) => f.name));
  const newFieldsByName = new Map(newSchema.fields.map((f) => [f.name, f]));

  for (const field of newSchema.fields) {
    const fieldName = field.name;

    if (fieldName in oldConfig) {
      const oldValue = oldConfig[fieldName];
      const isCompatible = isValueCompatibleWithField(oldValue, field);

      if (isCompatible) {
        result[fieldName] = oldValue;
      } else {
        result[fieldName] = getFieldDefault(field);
      }
    } else {
      result[fieldName] = getFieldDefault(field);
    }
  }

  for (const [key, value] of Object.entries(oldConfig)) {
    if (key.startsWith('elementStyles') || key === 'elementStyles') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Checks if a value is compatible with a field type.
 */
function isValueCompatibleWithField(value: unknown, field: WidgetConfigField): boolean {
  if (value === null || value === undefined) {
    return !field.required;
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'media':
    case 'color':
      return typeof value === 'string';

    case 'number':
      return typeof value === 'number';

    case 'toggle':
      return typeof value === 'boolean';

    case 'select':
      if (typeof value !== 'string') return false;
      if (field.options) {
        return field.options.some((opt) => opt.value === value);
      }
      return true;

    case 'array':
      return Array.isArray(value);

    case 'action':
    case 'data-binding':
      return typeof value === 'object';

    default:
      return true;
  }
}

/**
 * Gets the default value for a field based on its type.
 */
function getFieldDefault(field: WidgetConfigField): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'media':
    case 'color':
      return '';

    case 'number':
      return field.validation?.min ?? 0;

    case 'toggle':
      return false;

    case 'select':
      return field.options?.[0]?.value ?? '';

    case 'array':
      return [];

    case 'action':
    case 'data-binding':
      return null;

    default:
      return null;
  }
}

/**
 * Compares two schemas to identify breaking changes.
 */
export function getSchemaChanges(
  oldSchema: WidgetConfigSchema,
  newSchema: WidgetConfigSchema
): {
  added: string[];
  removed: string[];
  typeChanged: string[];
  optionsChanged: string[];
} {
  const oldFields = new Map(oldSchema.fields.map((f) => [f.name, f]));
  const newFields = new Map(newSchema.fields.map((f) => [f.name, f]));

  const added: string[] = [];
  const removed: string[] = [];
  const typeChanged: string[] = [];
  const optionsChanged: string[] = [];

  for (const [name, field] of newFields) {
    if (!oldFields.has(name)) {
      added.push(name);
    } else {
      const oldField = oldFields.get(name)!;
      if (oldField.type !== field.type) {
        typeChanged.push(name);
      } else if (field.type === 'select' && oldField.type === 'select') {
        const oldOptions = new Set(oldField.options?.map((o) => o.value) ?? []);
        const newOptions = new Set(field.options?.map((o) => o.value) ?? []);
        const hasChanges =
          oldOptions.size !== newOptions.size ||
          [...oldOptions].some((o) => !newOptions.has(o));
        if (hasChanges) {
          optionsChanged.push(name);
        }
      }
    }
  }

  for (const name of oldFields.keys()) {
    if (!newFields.has(name)) {
      removed.push(name);
    }
  }

  return { added, removed, typeChanged, optionsChanged };
}
