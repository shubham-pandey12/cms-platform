import type { Brand } from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { mapBrandDtoToBrand } from '../mappers/brandMapper';

export async function getBrands(): Promise<Brand[]> {
  try {
    const response = await apiClient.getBrands();
    return response.map(mapBrandDtoToBrand);
  } catch (error) {
    console.error('Failed to get brands:', error);
    return [];
  }
}

export async function getBrandById(id: string, usePublicClient = false): Promise<Brand | undefined> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getBrand(id);
    return mapBrandDtoToBrand(response);
  } catch (error) {
    console.error('Failed to get brand:', error);
    return undefined;
  }
}

export async function createBrand(data: {
  name: string;
  domain: string;
  subdomain?: string | null;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  globalCss?: string | null;
  customFontUrls?: string[] | null;
  themeId?: string | null;
  siteName?: string | null;
  siteDescription?: string | null;
  favicon?: string | null;
  logoUrl?: string | null;
  showNavigation?: boolean | null;
  navigationPosition?: string | null;
  navigationStyle?: string | null;
  showLogo?: boolean | null;
  enableSearch?: boolean | null;
  customDomain?: string | null;
}): Promise<Brand> {
  try {
    const response = await apiClient.createBrand(data);
    return mapBrandDtoToBrand(response);
  } catch (error) {
    console.error('Failed to create brand:', error);
    throw error;
  }
}

export async function deleteBrand(id: string): Promise<void> {
  try {
    await apiClient.deleteBrand(id);
  } catch (error) {
    console.error('Failed to delete brand:', error);
    throw error;
  }
}

type UpdateBrandPayload = {
  name?: string | null;
  domain?: string | null;
  subdomain?: string | null;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  globalCss?: string | null;
  customFontUrls?: string[] | null;
};

const UPDATE_BRAND_KEYS: (keyof UpdateBrandPayload)[] = [
  'name',
  'domain',
  'subdomain',
  'logo',
  'primaryColor',
  'secondaryColor',
  'globalCss',
  'customFontUrls',
];

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand | null> {
  try {
    const payload: UpdateBrandPayload = {};
    for (const key of UPDATE_BRAND_KEYS) {
      if (key in updates && updates[key as keyof Brand] !== undefined) {
        (payload as Record<string, unknown>)[key] = updates[key as keyof Brand];
      }
    }
    const response = await apiClient.updateBrand(id, payload);
    return mapBrandDtoToBrand(response);
  } catch (error) {
    console.error('Failed to update brand:', error);
    throw error;
  }
}

export async function updateBrandCustomFontUrls(id: string, urls: string[]): Promise<void> {
  await updateBrand(id, { customFontUrls: urls } as Partial<Brand>);
}

export interface BrandAvailability {
  domainAvailable: boolean;
  subdomainAvailable: boolean;
}

export async function checkBrandAvailability(params: {
  domain?: string | null;
  subdomain?: string | null;
  excludeBrandId?: string | null;
}): Promise<BrandAvailability> {
  try {
    return await apiClient.checkBrandAvailability(params);
  } catch (error) {
    console.error('Failed to check brand availability:', error);
    // On error, assume available so we do not block the user; submit will still validate on the server.
    return { domainAvailable: true, subdomainAvailable: true };
  }
}

export async function getBrandDomains(brandId: string): Promise<string[]> {
  return apiClient.getBrandDomains(brandId);
}

export async function addBrandDomain(brandId: string, domain: string): Promise<void> {
  await apiClient.addBrandDomain(brandId, domain);
}

export async function removeBrandDomain(brandId: string, domain: string): Promise<void> {
  await apiClient.removeBrandDomain(brandId, domain);
}
