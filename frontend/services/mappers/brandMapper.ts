import type { Brand, BrandDto } from '@/types/cms';

export function mapBrandDtoToBrand(dto: BrandDto): Brand {
  return {
    id: dto.id,
    name: dto.name,
    domain: dto.domain,
    subdomain: dto.subdomain,
    logo: dto.logo,
    primaryColor: dto.primaryColor,
    secondaryColor: dto.secondaryColor,
    globalCss: dto.globalCss,
    customFontUrls: dto.customFontUrls,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}
