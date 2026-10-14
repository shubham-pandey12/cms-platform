import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

export type BuildWidgetEmbedUrlParams = {
  /** Origin only, e.g. https://cms.example.com (no trailing slash). */
  baseOrigin: string;
  brandId: string;
  pageUri?: string | null;
  widgetInstanceId: string;
  /** When set and different from defaultLang, added as query param. */
  lang?: string;
  /** Defaults to en-GB; lang query omitted when lang matches. */
  defaultLang?: string;
};

/**
 * Normalizes a public site origin for embed URLs (trim, strip trailing slashes).
 */
export function normalizeEmbedBaseOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Builds GET /api/embed/widget with the same query shape as
 * [route.ts](frontend/app/api/embed/widget/route.ts) expects.
 */
export function buildWidgetEmbedUrl(params: BuildWidgetEmbedUrlParams): string {
  const base = normalizeEmbedBaseOrigin(params.baseOrigin);
  const baseForUrl = base.endsWith('/') ? base : `${base}/`;
  const url = new URL('api/embed/widget', baseForUrl);

  url.searchParams.set('brand', params.brandId);
  url.searchParams.set('widgetId', params.widgetInstanceId);

  const path = (params.pageUri ?? '/').trim() || '/';
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  if (trimmedPath) {
    url.searchParams.set('uri', trimmedPath);
  }

  const defaultLang = params.defaultLang ?? DEFAULT_LANG;
  const lang = params.lang?.trim();
  if (lang && lang !== defaultLang) {
    url.searchParams.set('lang', lang);
  }

  return url.toString();
}

/**
 * Client-only: base origin for copied embed links. Uses NEXT_PUBLIC_APP_ORIGIN when set, else window.location.origin.
 */
export function getEmbedLinkBaseOrigin(): string {
  const fromEnv = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() : '';
  if (fromEnv) {
    return normalizeEmbedBaseOrigin(fromEnv);
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
