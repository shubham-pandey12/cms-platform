'use client';

import React from 'react';
import { Brand, Page, SiteLayout, SiteSettings, WidgetDefinition, WidgetInstance } from '@/types/cms';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { StandaloneWidgetRenderer } from './PublishedPageRenderer';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

interface SiteLayoutWrapperProps {
  brand: Brand;
  page: Page;
  siteSettings?: SiteSettings;
  siteLayout?: SiteLayout;
  brandId: string;
  theme?: ThemeConfig;
  /** Language for widget i18n (e.g. from ?lang=fr-FR). Defaults to default locale (e.g. en-GB) when not provided. */
  lang?: string;
  renderHeader?: boolean;
  renderFooter?: boolean;
  widgetDefinitions: WidgetDefinition[];
  /** Server-resolved widget configs (widget id -> config). When provided for a layout widget, skips client-side API fetch. */
  initialResolvedConfigs?: Record<string, Record<string, unknown>>;
  /** Route params extracted from the dynamic URL pattern, e.g. { SLUG: "my-trip" }. Forwarded to layout widgets so they can use data bindings that reference URL variables. */
  routeParams?: Record<string, string>;
}

/**
 * Renders site layout (header/footer) for published pages.
 * Theme must be passed as a prop (loaded asynchronously by parent).
 */
export const SiteLayoutWrapper: React.FC<SiteLayoutWrapperProps> = ({
  brand,
  page,
  siteSettings,
  siteLayout,
  brandId,
  theme,
  lang = DEFAULT_LANG,
  renderHeader = true,
  renderFooter = true,
  widgetDefinitions,
  initialResolvedConfigs,
  routeParams,
}) => {
  // If no theme is provided, don't render anything
  if (!theme) {
    return null;
  }

  const themeConfig = {
    colors: theme.colors,
    fonts: theme.fonts,
  };

  // Respect site settings: hide header when showNavigation is false
  const showHeader = renderHeader && siteSettings?.showNavigation !== false;
  const showFooter = renderFooter;

  // Get header and footer widgets from site layout
  const headerWidgets = siteLayout?.header || [];
  const footerWidgets = siteLayout?.footer || [];

  // Sort widgets by order
  const sortWidgets = (widgets: WidgetInstance[]) => {
    return [...widgets]
      .filter(w => w && w.id && w.isVisible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Show all header widgets - no filtering or deduplication
  const sortedHeaderWidgets = sortWidgets(headerWidgets);
  const sortedFooterWidgets = sortWidgets(footerWidgets);

  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    if (showFooter) {
      console.log('SiteLayoutWrapper - Footer check:', {
        hasLayout: !!siteLayout,
        footerWidgetsCount: footerWidgets.length,
        sortedFooterWidgetsCount: sortedFooterWidgets.length,
        footerWidgets: footerWidgets,
      });
    }
  }

  return (
    <>
      {/* Header */}
      {showHeader && sortedHeaderWidgets.length > 0 && (
        <header
          className="w-full"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          {sortedHeaderWidgets.map((widget) => (
            <StandaloneWidgetRenderer
              key={widget.id}
              widgetInstance={widget}
              theme={themeConfig}
              pageId={page.id}
              brandId={brandId}
              widgetDefinitions={widgetDefinitions}
              initialResolvedConfig={initialResolvedConfigs?.[widget.id]}
              routeParams={routeParams}
              lang={lang}
            />
          ))}
        </header>
      )}

      {/* Footer */}
      {showFooter && sortedFooterWidgets.length > 0 && (
        <footer
          className="w-full"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          {sortedFooterWidgets.map((widget) => (
            <StandaloneWidgetRenderer
              key={widget.id}
              widgetInstance={widget}
              theme={themeConfig}
              pageId={page.id}
              brandId={brandId}
              widgetDefinitions={widgetDefinitions}
              initialResolvedConfig={initialResolvedConfigs?.[widget.id]}
              routeParams={routeParams}
              lang={lang}
            />
          ))}
        </footer>
      )}
    </>
  );
};
