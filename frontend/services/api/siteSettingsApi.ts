import type { SiteSettings, ScriptConfig } from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { parseJsonArray } from '../mappers/utils';

export async function getSiteSettings(
  brandKey: string,
  usePublicClient = false
): Promise<SiteSettings | undefined> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getSiteSettings(brandKey);

    const mapScripts = (scripts: unknown[]) =>
      scripts.map((s) => {
        const script = s as ScriptConfig & { async_?: boolean };
        const asyncValue = script.async ?? script.async_;
        return { ...script, async: asyncValue };
      });

    const headScripts = mapScripts(parseJsonArray(response.headScripts));
    const bodyScripts = mapScripts(parseJsonArray(response.bodyScripts));

    return {
      id: response.id,
      brandId: response.brandId,
      siteName: response.siteName,
      siteDescription: response.siteDescription,
      favicon: response.favicon,
      ogImage: response.ogImage,
      showNavigation: response.showNavigation,
      navigationPosition: response.navigationPosition as SiteSettings['navigationPosition'],
      navigationStyle: response.navigationStyle as SiteSettings['navigationStyle'],
      showLogo: response.showLogo,
      logoUrl: response.logoUrl,
      enableSearch: response.enableSearch,
      googleAnalyticsId: response.googleAnalyticsId,
      customHeadCode: response.customHeadCode,
      enableSocialSharing: response.enableSocialSharing,
      twitterHandle: response.twitterHandle,
      customDomain: response.customDomain,
      robotsTxt: response.robotsTxt,
      canonicalUrl: response.canonicalUrl,
      globalCss: response.globalCss,
      headScripts,
      bodyScripts,
      supportedLangs: Array.isArray(response.supportedLangs) ? response.supportedLangs : undefined,
      updatedAt: new Date(response.updatedAt),
    };
  } catch (error) {
    console.error('Failed to get site settings:', error);
    return undefined;
  }
}

export async function updateSiteSettings(
  brandId: string,
  updates: Partial<SiteSettings>
): Promise<SiteSettings | null> {
  try {
    const existing = await getSiteSettings(brandId);
    if (!existing) return null;

    const payload: Record<string, unknown> = { ...updates };
    if (updates.headScripts !== undefined) payload.headScripts = JSON.stringify(updates.headScripts);
    if (updates.bodyScripts !== undefined) payload.bodyScripts = JSON.stringify(updates.bodyScripts);
    // supportedLangs is sent as array; backend DTO accepts string[]
    await apiClient.updateSiteSettings(existing.id, payload);
    const refreshed = await getSiteSettings(brandId);
    return refreshed ?? null;
  } catch (error) {
    console.error('Failed to update site settings:', error);
    return null;
  }
}

export async function updateBrandGlobalCss(id: string, css: string): Promise<void> {
  await updateSiteSettings(id, { globalCss: css } as unknown as Partial<SiteSettings>);
}

export async function addSiteScript(
  brandId: string,
  script: Omit<ScriptConfig, 'id'>
): Promise<ScriptConfig> {
  const settings = await getSiteSettings(brandId);
  const scripts = settings?.headScripts ?? [];
  const newScript = { ...script, id: `script-${Date.now()}` };
  await updateSiteSettings(brandId, { headScripts: [...scripts, newScript] } as unknown as Partial<SiteSettings>);
  return newScript;
}

export async function removeSiteScript(brandId: string, scriptId: string): Promise<void> {
  const settings = await getSiteSettings(brandId);
  if (!settings) return;
  const filtered = (settings.headScripts ?? []).filter((s) => s.id !== scriptId);
  await updateSiteSettings(brandId, { headScripts: filtered } as unknown as Partial<SiteSettings>);
}

export async function updateSiteScript(
  brandId: string,
  scriptId: string,
  updates: Partial<ScriptConfig>
): Promise<ScriptConfig | null> {
  const settings = await getSiteSettings(brandId);
  if (!settings) return null;
  const updated = (settings.headScripts ?? []).map((s) => (s.id === scriptId ? { ...s, ...updates } : s));
  await updateSiteSettings(brandId, { headScripts: updated } as unknown as Partial<SiteSettings>);
  return updated.find((s) => s.id === scriptId) ?? null;
}
