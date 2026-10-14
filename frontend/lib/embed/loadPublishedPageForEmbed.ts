import {
  getBrandById,
  getPageByUri,
  getThemeById,
  getThemes,
  getSiteLayouts,
  getWidgetDefinitions,
} from '@/services/cmsApiService';
import type { Brand, Page, SiteLayout, ThemeDefinition, WidgetDefinition } from '@/types/cms';

export type PublishedEmbedPageContext = {
  page: Page;
  brand: Brand;
  theme: ThemeDefinition | undefined;
  siteLayout: SiteLayout | undefined;
  widgetDefinitions: WidgetDefinition[];
};

/**
 * Loads published page + brand context using public API (same rules as preview: published only).
 */
export async function loadPublishedPageForEmbed(
  brandKey: string,
  uriSegments?: string[]
): Promise<PublishedEmbedPageContext | null> {
  let normalizedUri = '/';
  if (uriSegments && uriSegments.length > 0) {
    const cleaned = uriSegments.join('/').replace(/^\/+|\/+$/g, '');
    normalizedUri = cleaned ? `/${cleaned}` : '/';
  }

  const usePublicClient = true;
  try {
    const [foundBrand, foundPage] = await Promise.all([
      getBrandById(brandKey, usePublicClient),
      getPageByUri(brandKey, normalizedUri, usePublicClient),
    ]);

    if (!foundBrand || !foundPage || foundPage.status !== 'published') {
      return null;
    }

    const [brandThemes, brandLayouts] = await Promise.all([
      getThemes(foundBrand.id, usePublicClient),
      getSiteLayouts(foundBrand.id, usePublicClient),
    ]);

    const defaultTheme = brandThemes.find((t) => t.isDefault) || brandThemes[0];
    const defaultLayout =
      brandLayouts.find((l) => l.isDefault) ||
      brandLayouts.find((l) => l.name === 'Default Layout') ||
      brandLayouts[0];

    const themeId = foundPage.themeId || defaultTheme?.id || 'theme-simple';
    const layoutId = foundPage.layoutId || defaultLayout?.id;
    const layoutData = layoutId ? (brandLayouts.find((l) => l.id === layoutId) ?? defaultLayout) : defaultLayout;

    const [themeData, widgetDefs] = await Promise.all([
      getThemeById(themeId, usePublicClient, foundBrand.id),
      getWidgetDefinitions(brandKey, usePublicClient),
    ]);

    return {
      page: foundPage,
      brand: foundBrand,
      theme: themeData,
      siteLayout: layoutData,
      widgetDefinitions: widgetDefs || [],
    };
  } catch {
    return null;
  }
}
