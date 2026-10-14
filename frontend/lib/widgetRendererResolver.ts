import { getCustomRenderer, getVersionedCustomRenderer } from '@/components/builder/customRenderers';
import type { WidgetDefinition, WidgetInstance } from '@/types/cms';
import type { CustomRenderer } from '@/types/renderTemplate';

/**
 * Resolve widget definition from an instance identifier.
 * Supports both UUID IDs and legacy slug references.
 */
export const resolveWidgetDefinitionForInstance = (
  widgetDefinitions: WidgetDefinition[],
  widgetInstance: WidgetInstance
): WidgetDefinition | undefined => {
  return widgetDefinitions.find(
    (definition) =>
      definition.id === widgetInstance.widgetDefinitionId ||
      definition.slug === widgetInstance.widgetDefinitionId
  );
};

/**
 * Resolve an optional custom renderer from a widget definition.
 */
export const resolveCustomRendererForDefinition = (
  widgetDefinition: WidgetDefinition | undefined
): CustomRenderer | undefined => {
  if (!widgetDefinition) {
    return undefined;
  }

  return getCustomRenderer(widgetDefinition.slug);
};

/**
 * Resolve a version-specific custom renderer for a widget instance.
 * Uses the widget instance's version to find the correct renderer.
 * Falls back to the latest version if the specific version is not found.
 */
export const resolveVersionedCustomRenderer = (
  widgetDefinition: WidgetDefinition | undefined,
  widgetInstance: WidgetInstance
): CustomRenderer | undefined => {
  if (!widgetDefinition) {
    return undefined;
  }

  const version = widgetInstance.widgetVersion || widgetDefinition.version;
  return getVersionedCustomRenderer(widgetDefinition.slug, version);
};
