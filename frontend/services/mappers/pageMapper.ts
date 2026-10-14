import type {
  Page,
  PageDto,
  PageSEO,
  PageSection,
  PageLayoutConfig,
  PageVariable,
} from '@/types/cms';
import { normalizeStatus } from './utils';
import { parsePageSections, parsePageLayoutConfig } from './schemas';

export function mapPageDtoToPage(dto: PageDto): Page {
  const bodyContent = parsePageSections(dto.bodyContent) as unknown as PageSection[];
  const layoutConfig = parsePageLayoutConfig(dto.layoutConfigJson) as unknown as PageLayoutConfig | undefined;

  return {
    id: dto.id,
    brandId: dto.brandId,
    name: dto.name,
    uri: dto.uri,
    isDynamic: dto.isDynamic,
    dynamicVariables: dto.dynamicVariables,
    status: normalizeStatus(dto.status),
    seo: dto.seo as PageSEO,
    layoutId: dto.layoutId,
    bodyContent,
    themeId: dto.themeId,
    layoutConfig,
    customCss: dto.customCss,
    version: typeof dto.version === 'number' ? `${dto.version}.0.0` : dto.version,
    publishedRevisionId: dto.publishedRevisionId || null,
    draftRevisionId: dto.draftRevisionId || '',
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
    createdBy: dto.createdBy || '',
    updatedBy: dto.updatedBy || '',
    routeParams: dto.routeParams,
  };
}

export function getStoredRouteParams(pageId: string): PageVariable[] {
  if (typeof window === 'undefined') return [];
  const key = `mcms_route_params_${pageId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.entries(parsed).map(([name, value]) => ({
      name,
      value,
      source: 'url' as PageVariable['source'],
    }));
  } catch {
    return [];
  }
}
