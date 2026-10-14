import type {
  WidgetDefinition,
  WidgetDefinitionVersion,
  WidgetDto,
  WidgetVersionListItem,
} from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { mapWidgetDtoToWidgetDefinition, mapWidgetVersionDtoToWidgetDefinitionVersion } from '../mappers/widgetMapper';

/** Normalizes query brandId so filtering is not skipped (whitespace/braces would fail the regex). */
const brandIdFilter = (brandId?: string) => {
  if (!brandId) return undefined;
  const trimmed = brandId.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/^\{|\}$/g, '');
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(normalized)
    ? normalized
    : undefined;
};

const isWidgetDefinitionUuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value.trim());

export async function getWidgetDefinitions(
  brandId?: string,
  usePublicClient = false
): Promise<WidgetDefinition[]> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getWidgets(brandIdFilter(brandId));
    return response.map(mapWidgetDtoToWidgetDefinition);
  } catch (error) {
    console.error('Failed to get widget definitions:', error);
    return [];
  }
}

export async function getWidgetDefinitionById(
  id: string,
  usePublicClient = false
): Promise<WidgetDefinition | undefined> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    if (isWidgetDefinitionUuid(id)) {
      const dto = await client.getWidget(id);
      return mapWidgetDtoToWidgetDefinition(dto as WidgetDto);
    }
    const widgets = await getWidgetDefinitions(undefined, usePublicClient);
    return widgets.find((w) => w.id === id || w.slug === id);
  } catch (error) {
    console.error('Failed to get widget definition:', error);
    return undefined;
  }
}

export async function getWidgetVersions(slug: string): Promise<WidgetVersionListItem[]> {
  try {
    const response = await apiClient.getWidgetVersions(slug);
    return response.map((v) => ({
      id: v.id,
      version: v.version,
      changeLog: v.changeLog,
      isLatest: v.isLatest,
      isDeprecated: v.isDeprecated,
      createdAt: new Date(v.createdAt),
    }));
  } catch (error) {
    console.error('Failed to get widget versions:', error);
    return [];
  }
}

export async function getWidgetVersion(
  slug: string,
  version: string
): Promise<WidgetDefinitionVersion | undefined> {
  try {
    const response = await apiClient.getWidgetVersion(slug, version);
    return mapWidgetVersionDtoToWidgetDefinitionVersion(response);
  } catch (error) {
    console.error('Failed to get widget version:', error);
    return undefined;
  }
}

export async function getAllWidgetVersions(slug: string): Promise<WidgetDefinitionVersion[]> {
  try {
    const response = await apiClient.getAllWidgetVersions(slug);
    return response.map(mapWidgetVersionDtoToWidgetDefinitionVersion);
  } catch (error) {
    console.error('Failed to get all widget versions:', error);
    return [];
  }
}
