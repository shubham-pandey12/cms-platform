import { describe, expect, it } from 'vitest';
import { findWidgetInPageBody } from '@/lib/embed/findWidgetInPageBody';
import type { Page, WidgetInstance } from '@/types/cms';

const w = (id: string): WidgetInstance => ({
  id,
  widgetDefinitionId: 'widget-cta',
  widgetVersion: '1.0.0',
  config: {},
  order: 0,
  isVisible: true,
});

function makePage(...ids: string[]): Page {
  return {
    id: 'page-1',
    brandId: 'b1',
    name: 'Test',
    uri: '/',
    isDynamic: false,
    dynamicVariables: [],
    status: 'published',
    seo: {
      title: 'T',
      description: '',
      keywords: [],
      canonicalUrl: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      noIndex: false,
      noFollow: false,
    },
    layoutId: 'l1',
    bodyContent: [
      {
        id: 's1',
        type: 'section',
        layout: '1-col',
        columns: [
          {
            id: 'c1',
            span: { mobile: 12, tablet: 12, desktop: 12 },
            widgets: ids.map((id) => w(id)),
          },
        ],
      },
    ],
    themeId: null,
    layoutConfig: undefined,
    customCss: undefined,
    version: '1.0.0',
    publishedRevisionId: null,
    draftRevisionId: 'd1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    createdBy: 'u1',
    updatedBy: 'u1',
    routeParams: {},
  } as unknown as Page;
}

describe('findWidgetInPageBody', () => {
  it('returns widget when id matches', () => {
    const page = makePage('a', 'target', 'c');
    const found = findWidgetInPageBody(page, 'target');
    expect(found?.id).toBe('target');
  });

  it('returns undefined when id is missing', () => {
    const page = makePage('x');
    expect(findWidgetInPageBody(page, 'missing')).toBeUndefined();
  });
});
