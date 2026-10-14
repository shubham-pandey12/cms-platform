/**
 * Centralized copy from data.json with typed access.
 * Use formatCopy(template, { key: value }) for templates with {{placeholder}}.
 */

import data from '@/data/data.json';

export type AppCopy = typeof data;
export const copy: AppCopy = data;

/**
 * Replaces {{key}} placeholders in a template string with values from params.
 */
export function formatCopy(
  template: string,
  params: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
  }
  return result;
}
