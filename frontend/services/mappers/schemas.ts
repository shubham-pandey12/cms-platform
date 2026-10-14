import { z } from 'zod';

/**
 * Zod schemas for API response shapes. Use safeParse for parse-and-validate with safe defaults.
 */

const pageSectionColumnSchema = z.object({
  id: z.string(),
  span: z.record(z.unknown()).optional(),
  widgets: z.array(z.record(z.unknown())),
});

export const pageSectionSchema = z.object({
  id: z.string(),
  type: z.literal('section').optional().default('section'),
  layout: z.string().optional(),
  styles: z.record(z.unknown()).optional(),
  columns: z.array(pageSectionColumnSchema).default([]),
});

export const pageSectionArraySchema = z.array(pageSectionSchema).default([]);

export const pageLayoutConfigSchema = z
  .object({
    maxWidth: z.enum(['full', 'xl', 'lg', 'md']).optional(),
    containerPadding: z.string().optional(),
    defaultBackground: z.string().optional(),
  })
  .optional();

/**
 * Parses a JSON string into an array of page sections with validation. Returns [] on failure.
 */
export function parsePageSections(value: string | null | undefined): z.infer<typeof pageSectionArraySchema> {
  if (!value) return [];
  try {
    const raw = JSON.parse(value) as unknown;
    const result = pageSectionArraySchema.safeParse(Array.isArray(raw) ? raw : []);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Parses a JSON string into page layout config with validation. Returns undefined on failure.
 */
export function parsePageLayoutConfig(
  value: string | null | undefined
): z.infer<typeof pageLayoutConfigSchema> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return pageLayoutConfigSchema.parse(parsed);
  } catch {
    return undefined;
  }
}
