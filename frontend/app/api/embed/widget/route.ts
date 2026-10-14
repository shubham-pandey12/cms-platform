import React from 'react';
import { buildInitialResolvedConfigsForPublishedPage, mergeWidgetDisplayConfig } from '@/lib/embed/resolvePublishedWidgetConfig';
import { findWidgetInPageBody } from '@/lib/embed/findWidgetInPageBody';
import { loadPublishedPageForEmbed } from '@/lib/embed/loadPublishedPageForEmbed';
import {
  EmbedThemeRoot,
  getEmbedRenderer,
  mergeEmbedWidgetStyles,
  EMBED_DEFAULT_LANG,
  type EmbedTheme,
} from '@/lib/embed/embedRenderers';
import { resolveWidgetDefinitionForInstance } from '@/lib/widgetRendererResolver';

const CACHE_HEADER = 'public, s-maxage=120, stale-while-revalidate=300';

function parseUriSegments(uriParam: string | null): string[] | undefined {
  if (uriParam == null || uriParam === '') {
    return undefined;
  }
  const decoded = decodeURIComponent(uriParam.trim());
  const trimmed = decoded.replace(/^\/+|\/+$/g, '');
  return trimmed ? trimmed.split('/').filter(Boolean) : undefined;
}

function fallbackTheme(): EmbedTheme {
  return {
    colors: {
      primary: '#0f172a',
      secondary: '#475569',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#2563eb',
    },
    fonts: { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' },
  };
}

function checkEmbedSecret(request: Request): boolean {
  const secret = process.env.EMBED_API_SECRET?.trim();
  if (!secret) {
    return true;
  }
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) {
    return true;
  }
  const url = new URL(request.url);
  return url.searchParams.get('key') === secret;
}

/**
 * Returns server-rendered HTML for one published widget instance (SEO-friendly embed).
 * Query: brand (brand id or slug), uri (page path, e.g. / or /about), widgetId (instance id).
 * Optional: lang (locale string).
 * When EMBED_API_SECRET is set, require Authorization: Bearer <secret> or ?key=<secret>.
 */
export async function GET(request: Request): Promise<Response> {
  if (!checkEmbedSecret(request)) {
    return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = new URL(request.url);
  const brand = url.searchParams.get('brand')?.trim();
  const widgetId = url.searchParams.get('widgetId')?.trim();
  const langParam = url.searchParams.get('lang')?.trim();

  if (!brand || !widgetId) {
    return new Response('Missing brand or widgetId', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const uriSegments = parseUriSegments(url.searchParams.get('uri'));
  const ctx = await loadPublishedPageForEmbed(brand, uriSegments);
  if (!ctx) {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const { page, theme, siteLayout, widgetDefinitions } = ctx;
  const instance = findWidgetInPageBody(page, widgetId);
  if (!instance) {
    return new Response('Widget not found on page body', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const widgetDef = resolveWidgetDefinitionForInstance(widgetDefinitions, instance);
  const slug = widgetDef?.slug;
  if (!slug || !widgetDef?.supportsHtmlEmbed) {
    return new Response('Embed not available for this widget type', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const Renderer = getEmbedRenderer(slug);
  if (!Renderer) {
    return new Response('Embed template not implemented for this widget type', {
      status: 501,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const initialMap = await buildInitialResolvedConfigsForPublishedPage(page, widgetDefinitions, siteLayout);
  const initial = initialMap[widgetId];
  const displayConfig = mergeWidgetDisplayConfig(widgetDef, instance, initial);
  const styles = mergeEmbedWidgetStyles(widgetDef, instance);

  const embedTheme: EmbedTheme = theme
    ? { colors: theme.colors, fonts: theme.fonts }
    : fallbackTheme();

  const lang = langParam || EMBED_DEFAULT_LANG;

  const { renderToString } = await import('react-dom/server');
  const html = renderToString(
    React.createElement(
      EmbedThemeRoot,
      { theme: embedTheme },
      React.createElement(Renderer, {
        config: displayConfig,
        styles,
        theme: embedTheme,
        lang,
      })
    )
  );

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': CACHE_HEADER,
    },
  });
}
