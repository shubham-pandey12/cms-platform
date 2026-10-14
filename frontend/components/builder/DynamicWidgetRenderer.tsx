'use client';

import React, { useEffect, useState } from 'react';
import { WidgetInstance, WidgetDefinition } from '@/types/cms';
import { getIcon } from '@/lib/iconRegistry';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { getPadding, getStyleValue } from '@/lib/styleUtils';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { getPageData } from '@/services/cmsApiService';
import { fetchAllApiData, applyDataBindings } from '@/lib/dataBinding';
import { resolveVersionedCustomRenderer } from '@/lib/widgetRendererResolver';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

interface DynamicWidgetRendererProps {
  widgetInstance: WidgetInstance;
  widgetDefinition: WidgetDefinition | undefined;
  theme: {
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
  };
  isPreviewMode?: boolean;
}

/**
 * Error Boundary Component for Widget Rendering
 */
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; widgetName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 border border-destructive/50 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Widget Rendering Error</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Failed to render widget: {this.props.widgetName}
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground font-mono">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Dynamic Widget Renderer
 * 
 * This component renders widgets based on their definition.
 * It first checks for a custom renderer, then falls back to a generic placeholder.
 * 
 * Benefits:
 * - Developers only need to add widget definitions in mockData
 * - Custom renderers are optional and only needed for complex widgets
 * - New widgets can be added without modifying this file
 */
export const DynamicWidgetRenderer: React.FC<DynamicWidgetRendererProps> = ({
  widgetInstance,
  widgetDefinition,
  theme,
  isPreviewMode = false,
}) => {
  const { currentPage, supportedLangs } = usePageBuilder();
  const lang = supportedLangs?.[0] ?? DEFAULT_LANG;
  
  // Merge default config with instance config
  const baseConfig = React.useMemo(() => {
    return { ...widgetDefinition?.defaultConfig, ...widgetInstance.config };
  }, [widgetDefinition?.defaultConfig, widgetInstance.config]);
  
  const [resolvedConfig, setResolvedConfig] = useState<Record<string, unknown>>(baseConfig);
  const [isLoading, setIsLoading] = useState(false);

  // Merge default styles with instance styles
  const styles = { ...widgetDefinition?.defaultStyles, ...widgetInstance.styles };

  // Fetch API data and apply data bindings if needed
  useEffect(() => {
    // Update base config if it changes
    setResolvedConfig(baseConfig);

    if (!currentPage || !widgetInstance.dataBindings || widgetInstance.dataBindings.length === 0) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get page data (API calls and variables)
        const pageData = await getPageData(currentPage.id);
        if (!pageData) {
          setIsLoading(false);
          return;
        }

        const { apiCalls, variables } = pageData;

        // Fetch all API data
        const apiResponses = await fetchAllApiData(apiCalls, variables);

        // Apply data bindings to config
        const resolved = applyDataBindings(widgetInstance, apiResponses, variables);
        setResolvedConfig(resolved);
      } catch (error) {
        console.error('Error loading widget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentPage, widgetInstance, baseConfig]);

  if (!widgetDefinition) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Unknown widget: {widgetInstance.widgetDefinitionId}
      </div>
    );
  }

  // Use resolved config (with data bindings applied if available)
  const config = resolvedConfig;

  const CustomRenderer = resolveVersionedCustomRenderer(widgetDefinition, widgetInstance);
  if (CustomRenderer) {
    return (
      <WidgetErrorBoundary widgetName={widgetDefinition.name}>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading data...
          </div>
        ) : (
          <CustomRenderer
            config={config}
            styles={styles as Record<string, unknown>}
            theme={theme}
            widgetId={widgetInstance.id}
            lang={lang}
            actions={widgetInstance.actions}
            isPreviewMode={isPreviewMode}
          />
        )}
      </WidgetErrorBoundary>
    );
  }

  // Fallback: Generic placeholder for widgets without custom renderers
  // This allows new widgets to be added without any code changes
  const IconComponent = getIcon(widgetDefinition.icon) || LayoutGrid;
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
        <p style={{ color: textColor, opacity: 0.7 }}>{widgetDefinition.name}</p>
        <p className="text-xs mt-2" style={{ color: textColor, opacity: 0.5 }}>
          Add a custom renderer for this widget in customRenderers/
        </p>
      </div>
    </div>
  );
};
