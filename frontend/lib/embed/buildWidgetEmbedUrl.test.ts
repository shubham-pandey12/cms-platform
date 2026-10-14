import { describe, expect, it, afterEach, vi } from 'vitest';
import { buildWidgetEmbedUrl, normalizeEmbedBaseOrigin, getEmbedLinkBaseOrigin } from '@/lib/embed/buildWidgetEmbedUrl';

describe('normalizeEmbedBaseOrigin', () => {
  it('trims and removes trailing slashes', () => {
    expect(normalizeEmbedBaseOrigin('  https://x.com///  ')).toBe('https://x.com');
  });
});

describe('buildWidgetEmbedUrl', () => {
  const base = 'https://cms.example.com';

  it('sets brand and widgetId; omits uri for home', () => {
    const u = buildWidgetEmbedUrl({
      baseOrigin: base,
      brandId: 'brand-uuid',
      pageUri: '/',
      widgetInstanceId: 'w-1',
    });
    const url = new URL(u);
    expect(url.origin + url.pathname).toBe('https://cms.example.com/api/embed/widget');
    expect(url.searchParams.get('brand')).toBe('brand-uuid');
    expect(url.searchParams.get('widgetId')).toBe('w-1');
    expect(url.searchParams.has('uri')).toBe(false);
  });

  it('sets uri path without leading slash for non-home', () => {
    const u = buildWidgetEmbedUrl({
      baseOrigin: base,
      brandId: 'b',
      pageUri: '/about/us',
      widgetInstanceId: 'w-2',
    });
    const url = new URL(u);
    expect(url.searchParams.get('uri')).toBe('about/us');
  });

  it('adds lang when different from default', () => {
    const u = buildWidgetEmbedUrl({
      baseOrigin: base,
      brandId: 'b',
      pageUri: '/',
      widgetInstanceId: 'w',
      lang: 'fr-FR',
      defaultLang: 'en-GB',
    });
    expect(new URL(u).searchParams.get('lang')).toBe('fr-FR');
  });

  it('omits lang when equal to default', () => {
    const u = buildWidgetEmbedUrl({
      baseOrigin: base,
      brandId: 'b',
      pageUri: '/',
      widgetInstanceId: 'w',
      lang: 'en-GB',
      defaultLang: 'en-GB',
    });
    expect(new URL(u).searchParams.has('lang')).toBe(false);
  });
});

describe('getEmbedLinkBaseOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_APP_ORIGIN when set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ORIGIN', 'https://prod.example.com/');
    expect(getEmbedLinkBaseOrigin()).toBe('https://prod.example.com');
  });
});
