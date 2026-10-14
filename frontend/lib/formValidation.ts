import { z } from 'zod';

/**
 * Form validation utilities using Zod
 * Provides comprehensive validation for form fields
 */

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'number' | 'min' | 'max';
  value?: number | string;
  message?: string;
}

export interface FieldValidationConfig {
  name: string;
  type: FieldType;
  required?: boolean;
  rules?: ValidationRule[];
  customValidator?: (value: string) => string | null;
}

/**
 * Create Zod schema for a field
 */
const createFieldSchema = (config: FieldValidationConfig): z.ZodString | z.ZodNumber | z.ZodBoolean => {
  let schema: z.ZodString | z.ZodNumber | z.ZodBoolean;

  switch (config.type) {
    case 'number':
      schema = z.number();
      break;
    case 'checkbox':
      schema = z.boolean();
      break;
    default:
      schema = z.string();
  }

  // Apply required validation
  if (config.required) {
    if (config.type === 'checkbox') {
      // For checkboxes, we might want to allow false, so only validate if it's truly required
      schema = schema as z.ZodBoolean;
    } else if (config.type === 'number') {
      schema = (schema as z.ZodNumber).min(0, config.rules?.find(r => r.type === 'min')?.message || 'Value must be at least 0');
    } else {
      schema = (schema as z.ZodString).min(1, config.rules?.find(r => r.type === 'required')?.message || 'This field is required');
    }
  }

  // Apply type-specific validations
  if (config.type === 'email') {
    schema = (schema as z.ZodString).email(
      config.rules?.find(r => r.type === 'email')?.message || 'Please enter a valid email address'
    );
  }

  if (config.type === 'tel') {
    const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    schema = (schema as z.ZodString).regex(
      phonePattern,
      config.rules?.find(r => r.type === 'phone')?.message || 'Please enter a valid phone number'
    );
  }

  // Apply custom rules
  if (config.rules) {
    config.rules.forEach((rule) => {
      if (rule.type === 'minLength' && typeof rule.value === 'number') {
        schema = (schema as z.ZodString).min(
          rule.value,
          rule.message || `Must be at least ${rule.value} characters`
        );
      }
      if (rule.type === 'maxLength' && typeof rule.value === 'number') {
        schema = (schema as z.ZodString).max(
          rule.value,
          rule.message || `Must be no more than ${rule.value} characters`
        );
      }
      if (rule.type === 'pattern' && typeof rule.value === 'string') {
        schema = (schema as z.ZodString).regex(
          new RegExp(rule.value),
          rule.message || 'Invalid format'
        );
      }
      if (rule.type === 'min' && typeof rule.value === 'number' && config.type === 'number') {
        schema = (schema as z.ZodNumber).min(rule.value, rule.message || `Must be at least ${rule.value}`);
      }
      if (rule.type === 'max' && typeof rule.value === 'number' && config.type === 'number') {
        schema = (schema as z.ZodNumber).max(rule.value, rule.message || `Must be no more than ${rule.value}`);
      }
    });
  }

  return schema;
};

/**
 * Validate a single field
 */
export const validateField = (
  value: string | number | boolean,
  config: FieldValidationConfig
): string | null => {
  try {
    const schema = createFieldSchema(config);
    
    // Convert value to appropriate type
    let typedValue: string | number | boolean = value;
    if (config.type === 'number') {
      typedValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(typedValue as number)) {
        return 'Please enter a valid number';
      }
    } else if (config.type === 'checkbox') {
      typedValue = value === 'true' || value === true;
    }

    schema.parse(typedValue);

    // Run custom validator if provided
    if (config.customValidator && typeof typedValue === 'string') {
      return config.customValidator(typedValue);
    }

    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Validation error';
  }
};

/**
 * Validate entire form
 */
export const validateForm = (
  formData: Record<string, string | number | boolean>,
  fieldConfigs: FieldValidationConfig[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  fieldConfigs.forEach((config) => {
    const value = formData[config.name];
    const error = validateField(value, config);
    if (error) {
      errors[config.name] = error;
    }
  });

  return errors;
};

/**
 * Check if form is valid
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
};
