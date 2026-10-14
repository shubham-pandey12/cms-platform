import type { Page, PageDto, PageRevisionDto, PageRevisionDetailDto } from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { mapPageDtoToPage } from '../mappers/pageMapper';

export async function getPages(brandId?: string): Promise<Page[]> {
  try {
    const response = await apiClient.getPages(brandId);
    return response.map(mapPageDtoToPage);
  } catch (error) {
    console.error('Failed to get pages:', error);
    return [];
  }
}

export async function getPageById(id: string, usePublicClient = false): Promise<Page | undefined> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getPage(id);
    return mapPageDtoToPage(response as PageDto);
  } catch (error) {
    console.error('Failed to get page:', error);
    return undefined;
  }
}

export async function createPage(page: {
  brandId: string;
  name: string;
  uri: string;
  isDynamic?: boolean;
  dynamicVariables?: string[];
  layoutId: string;
  bodyContent?: string;
  themeId?: string;
}): Promise<Page | null> {
  try {
    const response = await apiClient.createPage(page);
    return getPageById(response.id);
  } catch (error) {
    console.error('Failed to create page:', error);
    return null;
  }
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<Page | null> {
  try {
    const apiUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.uri !== undefined) apiUpdates.uri = updates.uri;
    if (updates.isDynamic !== undefined) apiUpdates.isDynamic = updates.isDynamic;
    if (updates.dynamicVariables !== undefined) apiUpdates.dynamicVariables = updates.dynamicVariables;
    if (updates.seo !== undefined) apiUpdates.seo = updates.seo;
    if (updates.bodyContent !== undefined) apiUpdates.bodyContent = JSON.stringify(updates.bodyContent);
    if (updates.themeId !== undefined) apiUpdates.themeId = updates.themeId;
    if (updates.layoutConfig !== undefined) apiUpdates.layoutConfigJson = JSON.stringify(updates.layoutConfig);
    if (updates.customCss !== undefined) apiUpdates.customCss = updates.customCss;

    await apiClient.updatePage(id, apiUpdates);
    return getPageById(id);
  } catch (error) {
    console.error('Failed to update page:', error);
    return null;
  }
}

export async function getPageRevisions(pageId: string): Promise<PageRevisionDto[]> {
  try {
    const response = await apiClient.getPageRevisions(pageId);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Failed to get page revisions:', error);
    return [];
  }
}

export async function getPageRevisionContent(
  pageId: string,
  revisionId: string
): Promise<PageRevisionDetailDto | null> {
  try {
    const response = await apiClient.getPageRevision(pageId, revisionId);
    return response as unknown as PageRevisionDetailDto;
  } catch (error) {
    console.error('Failed to get page revision content:', error);
    return null;
  }
}

export async function publishPage(
  id: string,
  version: string,
  revisionId?: string
): Promise<Page | null> {
  try {
    await apiClient.publishPage(id, { version, revisionId });
    return getPageById(id);
  } catch (error) {
    console.error('Failed to publish page:', error);
    return null;
  }
}

export async function deletePage(id: string): Promise<boolean> {
  try {
    await apiClient.deletePage(id);
    return true;
  } catch (error) {
    console.error('Failed to delete page:', error);
    return false;
  }
}

export async function getPageByUri(brandKey: string, uri: string, usePublicClient = false): Promise<Page | undefined> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getPageByUri(brandKey, uri);
    return mapPageDtoToPage(response as PageDto);
  } catch (error) {
    console.error('Failed to get page by URI:', error);
    return undefined;
  }
}

export async function getPublishedPageData(pageId: string, usePublicClient = false): Promise<Page | undefined> {
  try {
    const page = await getPageById(pageId, usePublicClient);
    if (page && page.status === 'published') return page;
    return undefined;
  } catch (error) {
    console.error('Failed to get published page data:', error);
    return undefined;
  }
}
