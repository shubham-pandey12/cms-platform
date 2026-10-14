import { fetchAllApiData, applyDataBindings } from '@/lib/dataBinding';
import { resolveWidgetEndpointConfig, WIDGET_ENDPOINT_MAP } from '@/lib/widgetEndpointSsr';
import { getPageData } from '@/services/api/pageDataApi';
import type { Page, SiteLayout, WidgetDefinition, WidgetInstance } from '@/types/cms';

/**
 * Merges definition defaults, instance config, and server-resolved overlay (bindings / endpoint SSR)
 * to match {@link StandaloneWidgetRenderer} initial config when `initialResolvedConfig` is provided.
 */
export function mergeWidgetDisplayConfig(
  widgetDefinition: WidgetDefinition | undefined,
  widgetInstance: WidgetInstance,
  initialResolvedFromPreview: Record<string, unknown> | undefined
): Record<string, unknown> {
  const defaultConf = (widgetDefinition?.defaultConfig ?? {}) as Record<string, unknown>;
  const inst = (widgetInstance.config ?? {}) as Record<string, unknown>;
  const initial = initialResolvedFromPreview ?? {};
  return { ...defaultConf, ...inst, ...initial };
}

/**
 * Builds the same `initialResolvedConfigs` map the preview page uses for SSR (body bindings,
 * body endpoint SSR, layout endpoint SSR). Single `fetchAllApiData` when the page defines API calls.
 */
export async function buildInitialResolvedConfigsForPublishedPage(
  page: Page,
  widgetDefinitions: WidgetDefinition[],
  siteLayout: SiteLayout | undefined
): Promise<Record<string, Record<string, unknown>>> {
  const initialResolvedConfigs: Record<string, Record<string, unknown>> = {};
  try {
    const urlVariables = Object.entries(page.routeParams ?? {}).map(([name, value]) => ({
      name,
      value,
      source: 'url' as const,
    }));
    const pageDataConfig = await getPageData(page.id, urlVariables, true);
    const { apiCalls, variables } = pageDataConfig;
    if (apiCalls.length > 0) {
      const apiResponses = await fetchAllApiData(apiCalls, variables);
      for (const section of page.bodyContent ?? []) {
        for (const column of section.columns ?? []) {
          for (const widget of column.widgets ?? []) {
            if (widget?.id && widget?.dataBindings?.length) {
              initialResolvedConfigs[widget.id] = applyDataBindings(widget, apiResponses, variables) as Record<
                string,
                unknown
              >;
            }
          }
        }
      }
    }

    const pageRouteParams = page.routeParams ?? undefined;

    for (const section of page.bodyContent ?? []) {
      for (const column of section.columns ?? []) {
        for (const widget of column.widgets ?? []) {
          if (!widget?.id) continue;
          const def = widgetDefinitions.find(
            (d) => d.id === widget.widgetDefinitionId || d.slug === widget.widgetDefinitionId
          );
          const slug = def?.slug;
          if (!slug || !WIDGET_ENDPOINT_MAP[slug]) continue;
          try {
            const baseConfig = {
              ...(widget.config as Record<string, unknown>),
              ...(initialResolvedConfigs[widget.id] ?? {}),
            };
            const resolved = await resolveWidgetEndpointConfig(widget, slug, baseConfig, pageRouteParams);
            initialResolvedConfigs[widget.id] = resolved;
          } catch {
            // Match preview: omit on failure; client may load
          }
        }
      }
    }

    const layoutWidgets = [...(siteLayout?.header ?? []), ...(siteLayout?.footer ?? [])];
    for (const widget of layoutWidgets) {
      if (!widget?.id) continue;
      const def = widgetDefinitions.find(
        (d) => d.id === widget.widgetDefinitionId || d.slug === widget.widgetDefinitionId
      );
      const slug = def?.slug;
      if (!slug || !WIDGET_ENDPOINT_MAP[slug]) continue;
      try {
        const baseConfig = {
          ...(widget.config as Record<string, unknown>),
          ...(initialResolvedConfigs[widget.id] ?? {}),
        };
        const resolved = await resolveWidgetEndpointConfig(widget, slug, baseConfig, pageRouteParams);
        initialResolvedConfigs[widget.id] = resolved;
      } catch {
        // Match preview
      }
    }
  } catch {
    return {};
  }
  return initialResolvedConfigs;
}
