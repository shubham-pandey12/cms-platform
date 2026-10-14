import type { SiteLayout } from '@/types/cms';
import { apiClient, getApiBaseUrl, publicApiClient } from '../apiClient';
import { mapSiteLayoutDtoToSiteLayout } from '../mappers/siteLayoutMapper';

export async function getSiteLayouts(brandId?: string, usePublicClient = false): Promise<SiteLayout[]> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getSiteLayouts(brandId);
    return response.map(mapSiteLayoutDtoToSiteLayout);
  } catch (error) {
    console.error('Failed to get site layouts:', error);
    return [];
  }
}

export async function getSiteLayoutById(
  id: string,
  usePublicClient = false,
  brandId?: string
): Promise<SiteLayout | undefined> {
  try {
    const layouts = await getSiteLayouts(brandId, usePublicClient);
    return layouts.find((l) => l.id === id);
  } catch (error) {
    console.error('Failed to get site layout:', error);
    return undefined;
  }
}

export async function updateSiteLayout(
  id: string,
  updates: Partial<SiteLayout>
): Promise<SiteLayout | null> {
  try {
    const apiUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.isDefault !== undefined) apiUpdates.isDefault = updates.isDefault;
    if (updates.header !== undefined) apiUpdates.header = JSON.stringify(updates.header);
    if (updates.footer !== undefined) apiUpdates.footer = JSON.stringify(updates.footer);
    if (updates.sidebar !== undefined) apiUpdates.sidebar = JSON.stringify(updates.sidebar);

    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/site-layouts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
      },
      body: JSON.stringify(apiUpdates),
    });

    if (response.ok) return getSiteLayoutById(id);
    return null;
  } catch (error) {
    console.error('Failed to update site layout:', error);
    return null;
  }
}
