import type { ThemeDefinition, ThemeDto } from '@/types/cms';

export function mapThemeDtoToThemeDefinition(dto: ThemeDto): ThemeDefinition {
  return {
    id: dto.id,
    name: dto.name,
    colors: dto.colors,
    fonts: dto.fonts,
    fontConfig: dto.fontConfig,
    isDefault: dto.isDefault,
    brandId: dto.brandId,
  };
}
