import type { SiteLayout, SiteLayoutDto, WidgetInstance } from '@/types/cms';
import { parseJsonArray } from './utils';

export function mapSiteLayoutDtoToSiteLayout(dto: SiteLayoutDto): SiteLayout {
  const header = parseJsonArray<WidgetInstance>(dto.header);
  const footer = parseJsonArray<WidgetInstance>(dto.footer);
  const sidebar = dto.sidebar ? parseJsonArray<WidgetInstance>(dto.sidebar) : undefined;

  return {
    id: dto.id,
    brandId: dto.brandId,
    name: dto.name,
    isDefault: dto.isDefault,
    header,
    footer,
    sidebar,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    createdBy: dto.createdBy || '',
    updatedBy: dto.updatedBy || '',
  };
}
