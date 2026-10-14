import { Metadata } from 'next';
import { headers } from 'next/headers';

export const revalidate = 60; // seconds; on-demand revalidation from publish can be wired later
import { notFound } from 'next/navigation';
import {
  getBrandById,
  getPageByUri,
  getThemeById,
  getThemes,
  getSiteSettings,
  getSiteLayouts,
  getWidgetDefinitions,
} from '@/services/cmsApiService';
import { buildInitialResolvedConfigsForPublishedPage } from '@/lib/embed/resolvePublishedWidgetConfig';
import { generateGoogleFontsUrl } from '@/lib/fontLoader';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { PublishedPageRenderer } from '@/components/viewer/PublishedPageRenderer';
import { SiteLayoutWrapper } from '@/components/viewer/SiteLayoutWrapper';
import type { Page, Brand, SiteSettings, SiteLayout, ThemeDefinition } from '@/types/cms';

interface PageProps {
  params: Promise<{
    brandKey: string;
    uri?: string[];
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Build public base URL (scheme + host) from request headers for canonical/OG URLs. */
async function getResolvedBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (h.get('host')?.includes('localhost') ? 'http' : 'https');
  const hostWithoutPort = host.split(':')[0] || host;
  return `${proto}://${hostWithoutPort}`;
}

async function getPageData(brandKey: string, uriSegments?: string[]) {
  // Normalize URI - default to home page if empty
  let normalizedUri = '/';
  if (uriSegments && uriSegments.length > 0) {
    const cleaned = uriSegments.join('/').replace(/^\/+|\/+$/g, '');
    normalizedUri = cleaned ? `/${cleaned}` : '/';
  }

  try {
    // Use public API client for preview pages (no authentication required)
    const usePublicClient = true;
    
    // Fetch all data in parallel
    const [foundBrand, foundPage] = await Promise.all([
      getBrandById(brandKey, usePublicClient),
      getPageByUri(brandKey, normalizedUri, usePublicClient),
    ]);

    if (!foundBrand || !foundPage) {
      return null;
    }

    // Check if page is published - use the page we already have from getPageByUri
    // (which is a public endpoint) instead of calling getPageById (which requires auth)
    if (foundPage.status !== 'published') {
      return null;
    }

    const publishedPage = foundPage;

    // Get themes and layouts for the brand to find defaults
    const [brandThemes, brandLayouts] = await Promise.all([
      getThemes(foundBrand.id, usePublicClient),
      getSiteLayouts(foundBrand.id, usePublicClient),
    ]);
    
    const defaultTheme = brandThemes.find(t => t.isDefault) || brandThemes[0];
    const defaultLayout = brandLayouts.find(l => l.isDefault) || brandLayouts.find(l => l.name === 'Default Layout') || brandLayouts[0];

    // Use page themeId if set, otherwise use brand's default theme, or fallback to 'theme-simple' for legacy
    const themeId = publishedPage.themeId || defaultTheme?.id || 'theme-simple';

    // Resolve layout from already-fetched brand layouts (no extra API call)
    const layoutId = publishedPage.layoutId || defaultLayout?.id;
    const layoutData = layoutId ? (brandLayouts.find(l => l.id === layoutId) ?? defaultLayout) : defaultLayout;

    // Load additional data in parallel (no getSiteLayoutById)
    const [themeData, settingsData, widgetDefs] = await Promise.all([
      getThemeById(themeId, usePublicClient, foundBrand.id),
      getSiteSettings(brandKey, usePublicClient),
      getWidgetDefinitions(brandKey, usePublicClient),
    ]);

    return {
      page: publishedPage,
      brand: foundBrand,
      theme: themeData,
      siteSettings: settingsData,
      siteLayout: layoutData,
      widgetDefinitions: widgetDefs || [],
    };
  } catch (error) {
    console.error('Error loading page data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getPageData(resolvedParams.brandKey, resolvedParams.uri);

  if (!data || !data.page) {
    return {
      title: 'Page Not Found',
    };
  }

  const { page, brand, siteSettings } = data;
  const siteName = siteSettings?.siteName || brand.name;
  const title = page.seo.ogTitle || page.seo.title || page.name;
  const description = page.seo.ogDescription || page.seo.description || siteSettings?.siteDescription || '';

  const baseUrl = await getResolvedBaseUrl();
  const pathSegments = resolvedParams.uri && resolvedParams.uri.length > 0
    ? '/' + resolvedParams.uri.join('/')
    : '/';
  const canonicalUrl = page.seo.canonicalUrl || `${baseUrl}${pathSegments}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${title} | ${siteName}`,
    description,
    keywords: page.seo.keywords,
    openGraph: {
      title: page.seo.ogTitle || title,
      description: page.seo.ogDescription || description,
      images: page.seo.ogImage ? [page.seo.ogImage] : siteSettings?.ogImage ? [siteSettings.ogImage] : [],
      type: 'website',
      siteName,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seo.twitterTitle || page.seo.ogTitle || title,
      description: page.seo.twitterDescription || page.seo.ogDescription || description,
      images: page.seo.twitterImage ? [page.seo.twitterImage] : page.seo.ogImage ? [page.seo.ogImage] : [],
    },
    robots: {
      index: !page.seo.noIndex,
      follow: !page.seo.noFollow,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getPageData(resolvedParams.brandKey, resolvedParams.uri);

  if (!data || !data.page || !data.brand) {
    notFound();
  }

  const { page, brand, theme, siteSettings, siteLayout, widgetDefinitions } = data;

  const initialResolvedConfigs = await buildInitialResolvedConfigsForPublishedPage(
    page,
    widgetDefinitions,
    siteLayout
  );

  const allowedLangs = siteSettings?.supportedLangs?.length ? siteSettings.supportedLangs : [DEFAULT_LANG];
  const langFromUrl = resolvedSearchParams?.lang;
  const langValue = typeof langFromUrl === 'string' ? langFromUrl : Array.isArray(langFromUrl) ? langFromUrl[0] : undefined;
  const lang = langValue && allowedLangs.includes(langValue) ? langValue : (allowedLangs[0] ?? DEFAULT_LANG);

  // Convert theme to the format expected by SiteLayoutWrapper
  const themeConfig = theme ? {
    colors: theme.colors,
    fonts: theme.fonts,
  } : undefined;

  // Generate font URLs
  const googleFontsUrl = theme ? generateGoogleFontsUrl(theme) : null;

  return (
    <>
      {/* Inject Google Fonts */}
      {googleFontsUrl && (
        <link id="google-fonts-link" rel="stylesheet" href={googleFontsUrl} />
      )}

      {/* Inject custom brand fonts */}
      {brand.customFontUrls?.map((fontUrl, index) => (
        <link key={index} id={`custom-font-${index}`} rel="stylesheet" href={fontUrl} />
      ))}

      {/* Inject custom CSS */}
      {(brand.globalCss || page.customCss) && (
        <style id="published-page-custom-css" dangerouslySetInnerHTML={{
          __html: [brand.globalCss || '', page.customCss || ''].filter(Boolean).join('\n\n')
        }} />
      )}

      {/* Apply theme CSS variables */}
      {theme && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --theme-primary: ${theme.colors.primary};
              --theme-secondary: ${theme.colors.secondary};
              --theme-background: ${theme.colors.background};
              --theme-text: ${theme.colors.text};
              --theme-accent: ${theme.colors.accent};
              --theme-font-heading: ${theme.fonts.heading};
              --theme-font-body: ${theme.fonts.body};
            }
          `
        }} />
      )}

      <div 
        className="min-h-screen flex flex-col w-full"
        style={{ 
          backgroundColor: theme?.colors.background || '#ffffff'
        }}
      >
        {/* Header from site layout */}
        <SiteLayoutWrapper
          brand={brand}
          page={page}
          siteSettings={siteSettings}
          siteLayout={siteLayout}
          brandId={resolvedParams.brandKey}
          theme={themeConfig}
          lang={lang}
          renderHeader={true}
          renderFooter={false}
          widgetDefinitions={widgetDefinitions}
          initialResolvedConfigs={initialResolvedConfigs}
          routeParams={page.routeParams ?? undefined}
        />
        
        {/* Main page content */}
        <div className="flex-1 w-full">
          <PublishedPageRenderer 
            page={page} 
            brandId={resolvedParams.brandKey} 
            routeParams={page.routeParams}
            initialTheme={themeConfig}
            initialWidgetDefinitions={widgetDefinitions}
            initialResolvedConfigs={initialResolvedConfigs}
            lang={lang}
          />
        </div>
        
        {/* Footer from site layout */}
        <SiteLayoutWrapper
          brand={brand}
          page={page}
          siteSettings={siteSettings}
          siteLayout={siteLayout}
          brandId={resolvedParams.brandKey}
          theme={themeConfig}
          lang={lang}
          renderHeader={false}
          renderFooter={true}
          widgetDefinitions={widgetDefinitions}
          initialResolvedConfigs={initialResolvedConfigs}
          routeParams={page.routeParams ?? undefined}
        />
      </div>
    </>
  );
}

