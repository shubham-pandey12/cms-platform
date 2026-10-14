import type { WidgetDefinition, WidgetInstance } from '@/types/cms';

/** Stable synthetic instance for Insert-panel live preview (same shape as canvas widgets). */
export function buildLibraryPreviewInstance(definition: WidgetDefinition): WidgetInstance {
  return {
    id: `library-preview-${definition.id}`,
    widgetDefinitionId: definition.id,
    widgetVersion: definition.version,
    config: {},
    order: 0,
    isVisible: true,
  };
}

export const isUniversalWidget = (widget: WidgetDefinition): boolean =>
  !widget.brandIds || widget.brandIds.length === 0;

export const isBrandScopedWidget = (brandId: string | undefined, widget: WidgetDefinition): boolean =>
  !!brandId && !!widget.brandIds?.length && widget.brandIds.includes(brandId);
