import type { PageSection, Template } from '@/types/cms';
import { apiClient } from '../apiClient';
import { parseJson } from '../mappers/utils';

export async function getTemplates(brandId?: string): Promise<Template[]> {
  try {
    const response = await apiClient.getTemplates(brandId);
    return response.map((t) => {
      const bodyContent: PageSection[] = parseJson<PageSection[]>(t.bodyContent) ?? [];
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        brandId: t.brandId,
        bodyContent,
        thumbnail: t.thumbnail,
        category: t.category,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        createdBy: t.createdBy,
      };
    });
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
}
