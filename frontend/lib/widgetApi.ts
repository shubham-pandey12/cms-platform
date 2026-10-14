/**
 * Helpers for widget-level API calls to keep dev/prod parity.
 * Resolves relative endpoints against the centralized API base URL and guards JSON parsing.
 */

import { getApiBaseUrl } from '@/lib/apiConfig';

const isAbsoluteUrl = (endpoint: string): boolean =>
  /^https?:\/\//i.test(endpoint) || endpoint.startsWith('//');

export const resolveWidgetApiUrl = (endpoint?: unknown): string | null => {
  if (typeof endpoint !== 'string') return null;
  const trimmed = endpoint.trim();
  if (!trimmed) return null;

  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  const configuredApiBaseUrl = getApiBaseUrl();
  const baseWithTrailingSlash = `${configuredApiBaseUrl}/`;
  const baseEndsWithApi = configuredApiBaseUrl.toLowerCase().endsWith('/api');

  // Avoid double /api/api when both base and endpoint include /api
  let normalizedEndpoint = trimmed.replace(/^\/+/, '');
  // Convert common typo "api-foo" to "api/foo" to avoid 404s
  if (normalizedEndpoint.toLowerCase().startsWith('api-')) {
    normalizedEndpoint = `api/${normalizedEndpoint.slice(4)}`;
  }

  if (baseEndsWithApi && normalizedEndpoint.toLowerCase().startsWith('api')) {
    // Strip the leading api (with optional slash or dash) to avoid /api/api-* duplication
    normalizedEndpoint = normalizedEndpoint.slice(3);
    normalizedEndpoint = normalizedEndpoint.replace(/^[-/]+/, '');
  }

  return new URL(normalizedEndpoint, baseWithTrailingSlash).toString();
};

export const parseJsonWithGuard = async (
  response: Response,
  requestUrl: string,
  contextLabel?: string
): Promise<unknown> => {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const responseText = await response.text();
  const trimmed = responseText.trimStart();

  if (contentType.includes('json')) {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      const snippet = trimmed.substring(0, 200);
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      throw new Error(
        `${contextLabel ?? 'API'} returned invalid JSON at ${requestUrl}: ${message}; body: ${snippet || 'empty'}`
      );
    }
  }

  const looksLikeHtml =
    trimmed.toLowerCase().startsWith('<!doctype html') || trimmed.toLowerCase().startsWith('<html');
  const snippet = trimmed.substring(0, 200);
  const statusText = `${response.status} ${response.statusText}`.trim();
  const label = contextLabel ?? 'API';

  if (looksLikeHtml) {
    throw new Error(
      `${label} responded with HTML instead of JSON at ${requestUrl} (status ${statusText || 'unknown'}). ` +
        'Check NEXT_PUBLIC_API_BASE_URL / proxy config and ensure the backend is running. ' +
        `Snippet: ${snippet || 'empty'}`
    );
  }

  throw new Error(
    `${label} returned non-JSON at ${requestUrl} (status ${statusText || 'unknown'}): ${snippet || 'empty'}`
  );
};

export const fetchWidgetJson = async (
  endpoint?: unknown,
  init?: RequestInit,
  contextLabel?: string
): Promise<unknown | null> => {
  const requestUrl = resolveWidgetApiUrl(endpoint);
  if (!requestUrl) return null;

  const requestInit: RequestInit = {
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  };

  const res = await fetch(requestUrl, requestInit);
  if (!res.ok) {
    const statusText = `${res.status} ${res.statusText}`.trim();
    throw new Error(`${contextLabel ?? 'API'} request failed (${statusText}) for ${requestUrl}`);
  }

  return parseJsonWithGuard(res, requestUrl, contextLabel);
};

type ProxyPayload = {
  endpoint: string;
  method: string;
  baseUrlKey?: string;
  credentialKey?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

/**
 * Execute a proxy call through the backend to keep credentials server-side.
 */
export const executeProxyJson = async (
  payload: ProxyPayload,
  contextLabel?: string
): Promise<unknown | null> => {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/proxy/execute`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const statusText = `${response.status} ${response.statusText}`.trim();
    const body = await response.text();
    throw new Error(`${contextLabel ?? 'Proxy'} request failed (${statusText}): ${body || 'no body'}`);
  }

  const parsed = await parseJsonWithGuard(response, url, contextLabel ?? 'Proxy');
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    // ProxyResponseDto shape
    // @ts-ignore
    return (parsed as any).data ?? null;
  }
  return parsed;
};

