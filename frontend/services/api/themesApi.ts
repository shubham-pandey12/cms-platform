import type { ThemeDefinition } from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { mapThemeDtoToThemeDefinition } from '../mappers/themeMapper';

const brandIdFilter = (brandId?: string) =>
  brandId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(brandId)
    ? brandId
    : undefined;

export async function getThemes(brandId?: string, usePublicClient = false): Promise<ThemeDefinition[]> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getThemes(brandIdFilter(brandId));
    return response.map(mapThemeDtoToThemeDefinition);
  } catch (error) {
    console.error('Failed to get themes:', error);
    return [];
  }
}

export async function getThemeById(
  id: string,
  usePublicClient = false,
  brandId?: string
): Promise<ThemeDefinition | undefined> {
  try {
    const themes = await getThemes(brandId, usePublicClient);
    return themes.find((t) => t.id === id);
  } catch (error) {
    console.error('Failed to get theme:', error);
    return undefined;
  }
}

/** Resolve the theme for a page: explicit themeId, else brand default; falls back to unscoped lookup for legacy/global ids. */
export async function resolveThemeForPage(
  themeId: string | undefined,
  brandId: string | undefined,
  usePublicClient = false
): Promise<ThemeDefinition | undefined> {
  if (!brandId) {
    if (!themeId) return undefined;
    return getThemeById(themeId, usePublicClient, undefined);
  }
  const brandThemes = await getThemes(brandId, usePublicClient);
  const defaultDef = brandThemes.find((t) => t.isDefault) || brandThemes[0];
  if (!themeId) {
    return defaultDef;
  }
  const resolved =
    brandThemes.find((t) => t.id === themeId) ??
    (await getThemeById(themeId, usePublicClient, brandId)) ??
    (await getThemeById(themeId, usePublicClient, undefined));
  return resolved ?? defaultDef;
}
