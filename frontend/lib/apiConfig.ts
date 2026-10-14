/**
 * Centralized API configuration.
 * Single source of truth for the backend base URL (no trailing slash).
 */

declare const process: {
  env: {
    [key: string]: string | undefined;
    NEXT_PUBLIC_API_BASE_URL?: string;
    API_BASE_URL?: string;
  };
};

const DEFAULT_API_BASE = 'https://localhost:5002/api';

/**
 * Returns the API base URL (no trailing slash) for the current context.
 * In the browser uses NEXT_PUBLIC_API_BASE_URL; on the server uses API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  let base: string;
  if (typeof window !== 'undefined') {
    base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE).trim() || DEFAULT_API_BASE;
  } else {
    base = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE).trim() || DEFAULT_API_BASE;
  }
  return base.replace(/\/+$/, '');
}
