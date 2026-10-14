/**
 * Server-side resolution of widget-level API endpoints for published pages.
 * Fetches config.apiEndpoint (and similar) URLs on the server and merges responses
 * into widget config so initial HTML shows data without JavaScript.
 */

import { resolveWidgetApiUrl, parseJsonWithGuard } from '@/lib/widgetApi';
import { applyRouteParamsToEndpoint } from '@/lib/widgetRouteParams';
import type { WidgetInstance } from '@/types/cms';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Single-endpoint widget: one config key (apiEndpoint) and one response key (e.g. slides). */
export type SingleEndpointMapping = {
  endpointKey: string;
  responseKey: string;
  /** Optional pagination for the initial SSR fetch (e.g. holiday-collections). */
  pagination?: { page: number; pageSize: number };
  /** Optional keys to look for in the API response (e.g. ['items', 'data']). Tried in order after responseKey; avoids hardcoding in core. */
  responseArrayKeys?: string[];
};

/** Multi-endpoint widget: multiple endpoint config keys, each mapping to a response config key. */
export type MultiEndpointMapping = {
  endpointToResponse: Array<{
    endpointKey: string;
    responseKey: string;
    /** Optional keys to look for in the API response. Tried in order after responseKey. */
    responseArrayKeys?: string[];
  }>;
};

export type EndpointMapping = SingleEndpointMapping | MultiEndpointMapping;

function isMulti(m: EndpointMapping): m is MultiEndpointMapping {
  return 'endpointToResponse' in m;
}

type SsrEndpointsModule = { endpointSsrMapping: EndpointMapping };

type RequireContext = { keys: () => string[]; (key: string): SsrEndpointsModule };

// Build map from widget folders: widgets/widget-<slug>/v<n>/ssrEndpoints.ts
// or widgets/<brand>/widget-<slug>/v<n>/ssrEndpoints.ts
// or widgets/<brand>/widget-<slug>/v<n>/ssrEndpoints.ts (any brand folder segment).
// Add ssrEndpoints.ts in a widget's version folder to enable endpoint SSR without touching this file.
// Direct require.context() is required so Webpack can statically replace it in the server bundle (otherwise WIDGET_ENDPOINT_MAP is empty on server and initial paint has no data).
// @ts-expect-error - require.context is a Webpack API, not on Node's Require type
const ssrContext = require.context(
  '../../widgets',
  true,
  /^\.\/(?:[^/]+\/)?widget-[^/]+\/v\d+\/ssrEndpoints\.(ts|tsx|js)$/
) as RequireContext;

const builtMap: Record<string, EndpointMapping> = {};
ssrContext.keys().forEach((key) => {
  const match = key.match(/^\.\/(?:[^/]+\/)?(widget-[^/]+)\/v\d+\/ssrEndpoints\.(ts|tsx|js)$/);
  if (match) {
    const slug = match[1];
    const mod = ssrContext(key);
    if (mod?.endpointSsrMapping) {
      builtMap[slug] = mod.endpointSsrMapping;
    }
  }
});

/**
 * Per-widget-slug mapping: which config keys hold endpoint URLs and where to put the response.
 * Built at build time from widgets/ (flat or widgets/<brand>/); no need to edit this file for new widgets.
 */
export const WIDGET_ENDPOINT_MAP: Record<string, EndpointMapping> = builtMap;

/**
 * Server-safe fetch for a single URL. Resolves relative URLs against getApiBaseUrl().
 * Returns parsed JSON or null on failure (caller can ignore and keep existing config).
 */
async function fetchWidgetJsonServer(
  endpoint: string,
  contextLabel: string,
  pagination?: { page: number; pageSize: number }
): Promise<unknown | null> {
  let url: string;
  const resolved = resolveWidgetApiUrl(endpoint);
  if (!resolved) return null;
  url = resolved;
  if (pagination) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}page=${pagination.page}&pageSize=${pagination.pageSize}`;
  }
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await parseJsonWithGuard(res, url, contextLabel);
  } catch {
    return null;
  }
}

/** Normalize API response to the shape widgets expect: { responseKey: array }. Uses responseArrayKeys when provided, else generic first-array fallback. */
function normalizeResponse(
  json: unknown,
  responseKey: string,
  responseArrayKeys?: string[]
): Record<string, unknown> {
  if (Array.isArray(json)) {
    return { [responseKey]: json };
  }
  if (isRecord(json)) {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj[responseKey])) return { [responseKey]: obj[responseKey] };
    if (responseArrayKeys?.length) {
      for (const key of responseArrayKeys) {
        if (Array.isArray(obj[key])) return { [responseKey]: obj[key] };
      }
    }
    const firstArray = Object.entries(obj).find(([, v]) => Array.isArray(v));
    if (firstArray) return { [responseKey]: firstArray[1] };
  }
  return {};
}

/**
 * Resolve widget-level endpoint(s) on the server and merge responses into config.
 * Uses WIDGET_ENDPOINT_MAP keyed by widget slug. Safe to call for any widget; returns
 * baseConfig unchanged if slug has no mapping or fetch fails.
 *
 * @param widget - Widget instance (config used to read endpoint URLs).
 * @param widgetSlug - WidgetDefinition.slug (e.g. widget-my-hero).
 * @param baseConfig - Existing config to merge into (e.g. from data bindings or widget.config).
 * @param routeParams - Optional dynamic page route params (e.g. { SUMMER: 'summer' }).
 *   When the widget instance config has `autoPassRouteParams: true`, these are appended
 *   to the endpoint URL as query params before the SSR fetch.
 * @returns Merged config with endpoint responses applied; or baseConfig on failure.
 */
export async function resolveWidgetEndpointConfig(
  widget: WidgetInstance,
  widgetSlug: string,
  baseConfig: Record<string, unknown>,
  routeParams?: Record<string, string>
): Promise<Record<string, unknown>> {
  const mapping = WIDGET_ENDPOINT_MAP[widgetSlug];
  if (!mapping) return baseConfig;

  const config = { ...baseConfig };

  const autoPass = Boolean(config.autoPassRouteParams ?? (widget.config as Record<string, unknown>)?.autoPassRouteParams);
  const paramMap = (config.routeParamMap ?? (widget.config as Record<string, unknown>)?.routeParamMap) as Record<string, string> | undefined;

  if (isMulti(mapping)) {
    for (const { endpointKey, responseKey, responseArrayKeys } of mapping.endpointToResponse) {
      let url = (config[endpointKey] ?? (widget.config as Record<string, unknown>)?.[endpointKey]) as string | undefined;
      if (typeof url !== 'string' || !url.trim()) continue;
      url = applyRouteParamsToEndpoint(url, routeParams, { enabled: autoPass, map: paramMap });
      const json = await fetchWidgetJsonServer(url, `Widget ${widgetSlug} ${endpointKey}`);
      if (json === null) continue;
      const normalized = normalizeResponse(json, responseKey, responseArrayKeys);
      Object.assign(config, normalized);
    }
    return config;
  }

  let url = (config[mapping.endpointKey] ?? (widget.config as Record<string, unknown>)?.[mapping.endpointKey]) as string | undefined;
  if (typeof url !== 'string' || !url.trim()) return config;

  url = applyRouteParamsToEndpoint(url, routeParams, { enabled: autoPass, map: paramMap });
  const pagination = 'pagination' in mapping && mapping.pagination ? mapping.pagination : undefined;
  const json = await fetchWidgetJsonServer(url, `Widget ${widgetSlug}`, pagination);
  if (json === null) return config;

  const normalized = normalizeResponse(json, mapping.responseKey, mapping.responseArrayKeys);
  if (Object.keys(normalized).length > 0) {
    Object.assign(config, normalized);
  }
  return config;
}
