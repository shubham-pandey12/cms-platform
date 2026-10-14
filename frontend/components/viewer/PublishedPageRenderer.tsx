'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Page, PageSection, WidgetInstance, WidgetDefinition, PageVariable } from '@/types/cms';
import { getThemeById, getThemes, getPageData, getWidgetDefinitions } from '@/services/cmsApiService';
import { fetchAllApiData, applyDataBindings } from '@/lib/dataBinding';
import { getIcon } from '@/lib/iconRegistry';
import { LayoutGrid } from 'lucide-react';
import { getPadding, getStyleValue, getResponsivePadding, getResponsiveMargin, getResponsiveSpanClasses } from '@/lib/styleUtils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { handlePreviewNavigation } from '@/lib/navigationUtils';
import { resolveVersionedCustomRenderer, resolveWidgetDefinitionForInstance } from '@/lib/widgetRendererResolver';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

interface PublishedPageRendererProps {
  page: Page;
  brandId: string;
  routeParams?: Record<string, string>;
  /** Pre-fetched theme from the server component. When provided, skips client-side theme fetch. */
  initialTheme?: {
    colors: { primary: string; secondary: string; background: string; text: string; accent: string };
    fonts: { heading: string; body: string };
  };
  /** Pre-fetched widget definitions from the server component. When provided, skips client-side fetch. */
  initialWidgetDefinitions?: WidgetDefinition[];
  /** Server-resolved widget configs (widget id -> config). When provided for a widget, skips client-side API/data-binding fetch. */
  initialResolvedConfigs?: Record<string, Record<string, unknown>>;
  /** Language for i18n (e.g. from ?lang=fr-FR). Defaults to default locale (e.g. en-GB) when not provided. */
  lang?: string;
}

/**
 * Standalone widget renderer for published pages
 * Doesn't depend on PageBuilderContext
 */
export const StandaloneWidgetRenderer: React.FC<{
  widgetInstance: WidgetInstance;
  theme: {
    colors: { primary: string; secondary: string; background: string; text: string; accent: string };
    fonts: { heading: string; body: string };
  };
  pageId: string;
  brandId: string;
  widgetDefinitions: WidgetDefinition[];
  routeParams?: Record<string, string>;
  /** When provided, use as initial config and skip client-side API/data-binding fetch. */
  initialResolvedConfig?: Record<string, unknown>;
  lang?: string;
}> = ({ widgetInstance, theme, pageId, brandId, widgetDefinitions, routeParams, initialResolvedConfig, lang = DEFAULT_LANG }) => {
  const router = useRouter();
  const widgetDef = resolveWidgetDefinitionForInstance(widgetDefinitions, widgetInstance);
  const baseConfig = useMemo(
    () => ({ ...widgetDef?.defaultConfig, ...widgetInstance.config }),
    [widgetDef?.defaultConfig, widgetInstance.config]
  );
  const hasDataBindings = !!(widgetInstance.dataBindings?.length);
  const [resolvedConfig, setResolvedConfig] = useState<Record<string, unknown>>(
    initialResolvedConfig ? { ...baseConfig, ...initialResolvedConfig } : baseConfig
  );
  const [isLoading, setIsLoading] = useState(Boolean(initialResolvedConfig ? false : hasDataBindings));

  // Fetch API data and apply data bindings only when server did not provide initial config
  useEffect(() => {
    if (initialResolvedConfig) return;

    setResolvedConfig(baseConfig);

    if (!widgetInstance.dataBindings || widgetInstance.dataBindings.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const urlVariables: PageVariable[] = Object.entries(routeParams || {}).map(([name, value]) => ({
          name,
          value,
          source: 'url',
        }));
        const pageData = await getPageData(pageId, urlVariables, true);
        if (!pageData) {
          setIsLoading(false);
          return;
        }

        const { apiCalls, variables } = pageData;
        const apiResponses = await fetchAllApiData(apiCalls, variables);
        const resolved = applyDataBindings(widgetInstance, apiResponses, variables);
        const mergedConfig = { ...baseConfig, ...resolved };
        setResolvedConfig(mergedConfig);
      } catch (error) {
        console.error('Error loading widget data:', error);
        setResolvedConfig(baseConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId, widgetInstance, widgetDef, routeParams, initialResolvedConfig, baseConfig]);

  if (!widgetDef) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Unknown widget: {widgetInstance.widgetDefinitionId}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  const styles = { ...widgetDef.defaultStyles, ...widgetInstance.styles };
  const config = resolvedConfig;

  // Handle navigation actions - convert internal links to preview URLs
  const handleAction = (action: any) => {
    if (action?.type === 'navigate' && action?.payload?.url) {
      const url = action.payload.url;
      handlePreviewNavigation(url, action.payload.target || '_self', router);
    }
  };

  // Create actions object with navigation handler
  const actions = {
    ...widgetInstance.actions,
    onClick: widgetInstance.actions?.onClick 
      ? { ...widgetInstance.actions.onClick, handler: handleAction }
      : undefined,
  };

  const CustomRenderer = resolveVersionedCustomRenderer(widgetDef, widgetInstance);
  if (CustomRenderer) {
    try {
      return (
        <CustomRenderer
          config={config}
          styles={styles as Record<string, unknown>}
          theme={theme}
          widgetId={widgetInstance.id}
          lang={lang}
          actions={actions}
          isPreviewMode={true}
          pageId={pageId}
          routeParams={routeParams}
        />
      );
    } catch (error) {
      console.error('Error rendering custom widget:', error);
    }
  }

  // Fallback: Generic placeholder
  const IconComponent = getIcon(widgetDef.icon) || LayoutGrid;
  const bgColor = getStyleValue(styles.backgroundColor as string, 'transparent');
  const textColor = getStyleValue(styles.textColor as string, theme.colors.text);
  const padding = getPadding(styles.padding as string);

  return (
    <div 
      style={{ 
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${theme.colors.primary}15` }}
        >
          <IconComponent className="w-6 h-6" style={{ color: theme.colors.primary }} />
        </div>
        <p style={{ color: textColor, opacity: 0.7 }}>{widgetDef.name}</p>
      </div>
    </div>
  );
};

/**
 * Standalone section renderer for published pages
 */
const StandaloneSectionRenderer: React.FC<{
  section: PageSection;
  theme: {
    colors: { primary: string; secondary: string; background: string; text: string; accent: string };
    fonts: { heading: string; body: string };
  };
  pageId: string;
  brandId: string;
  widgetDefinitions: WidgetDefinition[];
  routeParams?: Record<string, string>;
  initialResolvedConfigs?: Record<string, Record<string, unknown>>;
  lang?: string;
}> = ({ section, theme, pageId, brandId, widgetDefinitions, routeParams, initialResolvedConfigs, lang: sectionLang }) => {
  if (!section || !Array.isArray(section.columns)) {
    return null;
  }

  // Keep section wrapper neutral; widgets own spacing.
  const responsivePadding = { mobile: '0', tablet: '0', desktop: '0' };
  const responsiveMargin = { mobile: '0', tablet: '0', desktop: '0' };

  const sectionStyles: React.CSSProperties = {
    backgroundColor: section.styles?.backgroundColor,
  };

  // Add responsive padding/margin via CSS custom properties for media queries
  const sectionStyleWithMedia = {
    ...sectionStyles,
    '--padding-mobile': responsivePadding.mobile,
    '--padding-tablet': responsivePadding.tablet,
    '--padding-desktop': responsivePadding.desktop,
    '--margin-mobile': responsiveMargin.mobile,
    '--margin-tablet': responsiveMargin.tablet,
    '--margin-desktop': responsiveMargin.desktop,
  } as React.CSSProperties & {
    '--padding-mobile': string;
    '--padding-tablet': string;
    '--padding-desktop': string;
    '--margin-mobile': string;
    '--margin-tablet': string;
    '--margin-desktop': string;
  };

  const containerMaxWidth = section.styles?.containerMaxWidth || 'full';
  // On mobile, always use full width. On larger screens, apply max-width
  const maxWidthClass = {
    'full': 'max-w-full',
    'xl': 'max-w-full md:max-w-7xl',
    'lg': 'max-w-full md:max-w-5xl',
    'md': 'max-w-full md:max-w-3xl',
  }[containerMaxWidth] || 'max-w-full';

  return (
    <div
      className={cn(
        'section-wrapper w-full',
        !section.styles?.fullWidth && 'md:mx-auto',
        maxWidthClass
      )}
      style={sectionStyleWithMedia}
    >
      <style>{`
        .section-wrapper {
          padding: var(--padding-mobile, 0);
          margin: var(--margin-mobile, 0);
        }
        @media (min-width: 768px) {
          .section-wrapper {
            padding: var(--padding-tablet, 0);
            margin: var(--margin-tablet, 0);
          }
        }
        @media (min-width: 1024px) {
          .section-wrapper {
            padding: var(--padding-desktop, 0);
            margin: var(--margin-desktop, 0);
          }
        }
      `}</style>
      <div 
        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 lg:gap-6"
      >
        {section.columns.map((column) => {
          if (!column || !column.id || !Array.isArray(column.widgets)) {
            return null;
          }

          const spanClasses = getResponsiveSpanClasses(column.span);
          const sortedWidgets = [...column.widgets]
            .filter(w => w && w.id && w.isVisible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div
              key={column.id}
              className={spanClasses}
            >
              <div className="space-y-4">
                {sortedWidgets.map((widget) => (
                  <StandaloneWidgetRenderer
                    key={widget.id}
                    widgetInstance={widget}
                    theme={theme}
                    pageId={pageId}
                    brandId={brandId}
                    widgetDefinitions={widgetDefinitions}
                    routeParams={routeParams}
                    initialResolvedConfig={initialResolvedConfigs?.[widget.id]}
                    lang={sectionLang}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main published page renderer component
 */
export const PublishedPageRenderer: React.FC<PublishedPageRendererProps> = ({
  page,
  brandId,
  routeParams,
  initialTheme,
  initialWidgetDefinitions,
  initialResolvedConfigs,
  lang: langProp,
}) => {
  const [widgetDefinitions, setWidgetDefinitions] = useState<WidgetDefinition[]>(initialWidgetDefinitions ?? []);
  const hasInitialData = !!(initialTheme && initialWidgetDefinitions?.length);
  const [isLoadingDefs, setIsLoadingDefs] = useState(!hasInitialData);
  const [theme, setTheme] = useState<{
    colors: { primary: string; secondary: string; background: string; text: string; accent: string };
    fonts: { heading: string; body: string };
  } | null>(initialTheme ?? null);
  const [attemptedThemeId, setAttemptedThemeId] = useState<string | null>(null);

  // Only fetch client-side when the server didn't provide the data
  useEffect(() => {
    if (hasInitialData) return;

    const loadData = async () => {
      setIsLoadingDefs(true);
      try {
        const brandThemes = await getThemes(brandId, true);
        const defaultTheme = brandThemes.find(t => t.isDefault) || brandThemes[0];
        
        const themeId = page.themeId || defaultTheme?.id || 'theme-simple';
        setAttemptedThemeId(themeId);
        
        const [defs, themeData] = await Promise.all([
          getWidgetDefinitions(brandId, true),
          getThemeById(themeId, true, brandId),
        ]);
        setWidgetDefinitions(defs);
        if (themeData) {
          setTheme({
            colors: themeData.colors,
            fonts: themeData.fonts,
          });
        }
      } catch (error) {
        console.error('Error loading page renderer data:', error);
      } finally {
        setIsLoadingDefs(false);
      }
    };
    loadData();
  }, [page.themeId, brandId, hasInitialData]);

  if (isLoadingDefs) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!theme) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Theme not found: {attemptedThemeId || page.themeId || 'default'}
      </div>
    );
  }

  // Show all widgets exactly as they appear in the builder - no filtering
  const bodyContent = page.bodyContent || [];

  if (bodyContent.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <p>This page has no content.</p>
      </div>
    );
  }

  return (
    <main 
      className="w-full"
      style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <div className="space-y-0">
        {bodyContent.map((section) => (
          <StandaloneSectionRenderer
            key={section.id}
            section={section}
            theme={theme}
            pageId={page.id}
            brandId={brandId}
            widgetDefinitions={widgetDefinitions}
            routeParams={routeParams}
            initialResolvedConfigs={initialResolvedConfigs}
            lang={langProp}
          />
        ))}
      </div>
    </main>
  );
};
