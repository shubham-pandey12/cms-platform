/**
 * Shared mapper utilities for JSON parsing and status normalization.
 */

export type PageStatus = 'draft' | 'published' | 'disabled';

export function normalizeStatus(status: unknown): PageStatus {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === 'published') return 'published';
    if (normalized === 'disabled') return 'disabled';
    return 'draft';
  }

  if (typeof status === 'number') {
    if (status === 1) return 'published';
    if (status === 2) return 'disabled';
    return 'draft';
  }

  return 'draft';
}

export function parseJsonArray<T>(value?: string | null): T[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export function parseJson<T>(value?: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}
