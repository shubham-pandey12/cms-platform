/**
 * API Client for communicating with the backend
 * Works in both client and server contexts
 *
 * Note: For server-side requests to HTTPS with self-signed certificates in development,
 * set NODE_TLS_REJECT_UNAUTHORIZED=0 in your environment or use the dev script in package.json
 */

import { getApiBaseUrl } from '@/lib/apiConfig';
import type { TokenStorage } from '@/lib/tokenStorage';
import { browserTokenStorage, noopTokenStorage } from '@/lib/tokenStorage';

export { getApiBaseUrl };

declare const process: {
  env: {
    [key: string]: string | undefined;
    NEXT_PUBLIC_USE_MOCK_DATA?: string;
    NODE_ENV?: string;
  };
};

const API_BASE_URL = getApiBaseUrl();
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

/** Matches GET /widgets and GET /widgets/{id} JSON shape (category may be number from API). */
export type WidgetDefinitionApiRow = {
  id: string;
  slug: string;
  name: string;
  category: string | number;
  description: string;
  icon: string;
  version: string;
  thumbnail?: string;
  configSchema: string;
  defaultConfig: string;
  defaultStyles?: {
    backgroundColor?: string;
    textColor?: string;
    padding: string;
    margin: string;
    borderRadius: number;
    borderWidth: number;
    borderColor?: string;
    shadow: string;
    opacity: number;
    textAlign?: string;
    customClasses?: string;
  };
  brandIds: string[];
  isAdvanced: boolean;
  supportsHtmlEmbed?: boolean;
  createdAt: string;
  updatedAt: string;
};

class ApiClient {
  private baseUrl: string;
  private readonly tokenStorage: TokenStorage;
  private unauthorizedHandler?: () => void;
  private forbiddenHandler?: (message: string) => void;

  private static readonly AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

  constructor(baseUrl: string, tokenStorage?: TokenStorage) {
    this.baseUrl = baseUrl;
    this.tokenStorage = tokenStorage ?? browserTokenStorage;
  }

  /** Registers a callback invoked when a non-auth request receives HTTP 401 (session expired). */
  onUnauthorized(handler: () => void): void {
    this.unauthorizedHandler = handler;
  }

  /**
   * Registers a callback invoked when a request receives HTTP 403 (insufficient permissions).
   * Use this to render an "Access denied" state rather than clearing the session.
   */
  onForbidden(handler: (message: string) => void): void {
    this.forbiddenHandler = handler;
  }

  /** Sets the auth token; also persisted by the configured token storage (e.g. localStorage in browser). */
  setToken(token: string | null): void {
    this.tokenStorage.setToken(token);
  }

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    /** When set, uses this token only and does not clear global session on 401 (for server-concurrent or explicit-token calls). */
    isolatedToken?: string
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = isolatedToken !== undefined ? isolatedToken : this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (
          response.status === 401 &&
          !ApiClient.AUTH_ENDPOINTS.some(ep => endpoint.startsWith(ep)) &&
          isolatedToken === undefined
        ) {
          this.setToken(null);
          this.unauthorizedHandler?.();
          throw new Error('Session expired');
        }
        if (response.status === 401) {
          throw new Error('Session expired');
        }

        if (response.status === 403) {
          // Authenticated but not authorised — do NOT clear the token.
          let deniedMessage = 'You do not have permission to perform this action.';
          try {
            const errBody = await response.json();
            deniedMessage =
              (typeof errBody.detail === 'string' && errBody.detail) ||
              errBody.message ||
              deniedMessage;
          } catch { /* ignore parse errors */ }
          this.forbiddenHandler?.(deniedMessage);
          throw new Error(deniedMessage);
        }

        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        let errorDetails = '';
        
        try {
          const error = await response.json();
          errorMessage =
            (typeof error.detail === 'string' && error.detail) ||
            error.message ||
            error.error ||
            errorMessage;
          errorDetails = JSON.stringify(error).substring(0, 200);
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorDetails = text.substring(0, 200);
            }
          } catch {
            // Ignore text parsing errors
          }
        }
        
        const fullError = errorDetails 
          ? `${errorMessage} - ${errorDetails}`
          : errorMessage;
        
        console.error(`API request failed: ${url} - ${fullError}`);
        throw new Error(fullError);
      }

      if (response.status === 204) return undefined as T;
      return response.json();
    } catch (error) {
      // Log network errors
      if (error instanceof TypeError && error.message.includes('fetch failed')) {
        console.error(`Network error calling ${url}:`, error.message);
        throw new Error(`Failed to connect to API at ${this.baseUrl}. Is the backend running?`);
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      token: string;
      refreshToken: string;
      expiresAt: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        brandIds: string[];
        effectivePermissions?: {
          organizationPermissionKeys: string[];
          brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
        } | null;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string) {
    return this.request<{
      token: string;
      refreshToken: string;
      expiresAt: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        brandIds: string[];
        effectivePermissions?: {
          organizationPermissionKeys: string[];
          brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
        } | null;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getCurrentUser(explicitToken?: string) {
    type MeResponse = {
      id: string;
      email: string;
      name: string;
      role: string;
      brandIds: string[];
      effectivePermissions?: {
        organizationPermissionKeys: string[];
        brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
      } | null;
    };
    if (explicitToken !== undefined) {
      return this.request<MeResponse>('/auth/me', {}, explicitToken);
    }
    return this.request<MeResponse>('/auth/me');
  }

  // Brands endpoints
  async getBrands() {
    return this.request<Array<{
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      globalCss?: string;
      customFontUrls: string[];
      createdAt: string;
      updatedAt: string;
    }>>('/brands');
  }

  async getBrand(id: string) {
    return this.request<{
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      globalCss?: string;
      customFontUrls: string[];
      createdAt: string;
      updatedAt: string;
    }>(`/brands/${id}`);
  }

  async createBrand(data: {
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
  }) {
    return this.request<{
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      globalCss?: string;
      customFontUrls: string[];
      createdAt: string;
      updatedAt: string;
    }>('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(id: string) {
    return this.request<void>(`/brands/${id}`, { method: 'DELETE' });
  }

  /** Check if domain and subdomain are available. For edit, pass excludeBrandId. */
  async checkBrandAvailability(params: {
    domain?: string | null;
    subdomain?: string | null;
    excludeBrandId?: string | null;
  }) {
    const q = new URLSearchParams();
    if (params.domain != null && params.domain !== '') q.set('domain', params.domain);
    if (params.subdomain != null && params.subdomain !== '') q.set('subdomain', params.subdomain);
    if (params.excludeBrandId != null && params.excludeBrandId !== '') q.set('excludeBrandId', params.excludeBrandId);
    return this.request<{ domainAvailable: boolean; subdomainAvailable: boolean }>(
      `/brands/check-availability?${q.toString()}`
    );
  }

  async getBrandDomains(brandId: string): Promise<string[]> {
    return this.request<string[]>(`/brands/${brandId}/domains`);
  }

  async addBrandDomain(brandId: string, domain: string): Promise<void> {
    return this.request<void>(`/brands/${brandId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  async removeBrandDomain(brandId: string, domain: string): Promise<void> {
    return this.request<void>(`/brands/${brandId}/domains/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    });
  }

  // Brand URL redirects (admin CRUD; resolve is anonymous for middleware)
  async getRedirects(brandId: string) {
    return this.request<Array<{
      id: string;
      from: string;
      to: string;
      brandId: string;
      status: number;
      createdAt: string;
      updatedAt?: string | null;
    }>>(`/brands/${brandId}/redirects`);
  }

  async getRedirect(brandId: string, id: string) {
    return this.request<{
      id: string;
      from: string;
      to: string;
      brandId: string;
      status: number;
      createdAt: string;
      updatedAt?: string | null;
    }>(`/brands/${brandId}/redirects/${id}`);
  }

  async createRedirect(brandId: string, data: { from: string; to: string; status: number }) {
    return this.request<{
      id: string;
      from: string;
      to: string;
      brandId: string;
      status: number;
      createdAt: string;
      updatedAt?: string | null;
    }>(`/brands/${brandId}/redirects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRedirect(
    brandId: string,
    id: string,
    data: { from?: string | null; to?: string | null; status?: number | null }
  ) {
    return this.request<{
      id: string;
      from: string;
      to: string;
      brandId: string;
      status: number;
      createdAt: string;
      updatedAt?: string | null;
    }>(`/brands/${brandId}/redirects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRedirect(brandId: string, id: string): Promise<void> {
    return this.request<void>(`/brands/${brandId}/redirects/${id}`, { method: 'DELETE' });
  }

  // Users (admin only)
  async getUsers() {
    return this.request<Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      brandIds: string[];
      createdAt: string;
    }>>('/users');
  }

  async getUser(id: string) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      brandIds: string[];
      createdAt: string;
    }>(`/users/${id}`);
  }

  async updateUser(
    id: string,
    data: { name?: string | null; role: string; brandIds?: string[] | null }
  ) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      brandIds: string[];
      createdAt: string;
    }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name ?? undefined,
        role: data.role,
        brandIds: data.brandIds ?? undefined,
      }),
    });
  }

  async getRoles() {
    return this.request<Array<{
      id: string;
      key: string;
      name: string;
      description: string;
      isSystem: boolean;
      permissions: Array<{
        id: string;
        key: string;
        name: string;
        description: string;
        isOrganizationLevel: boolean;
      }>;
    }>>('/roles');
  }

  async getRolePermissionsCatalog() {
    return this.request<Array<{
      id: string;
      key: string;
      name: string;
      description: string;
      isOrganizationLevel: boolean;
    }>>('/roles/permissions');
  }

  async createRole(data: { key?: string | null; name: string; description?: string | null; permissionKeys?: string[] | null }) {
    return this.request<{
      id: string;
      key: string;
      name: string;
      description: string;
      isSystem: boolean;
      permissions: Array<{
        id: string;
        key: string;
        name: string;
        description: string;
        isOrganizationLevel: boolean;
      }>;
    }>('/roles', {
      method: 'POST',
      body: JSON.stringify({
        key: data.key ?? undefined,
        name: data.name,
        description: data.description ?? undefined,
        permissionKeys: data.permissionKeys ?? undefined,
      }),
    });
  }

  async updateRoleMetadata(roleId: string, data: { name: string; description?: string | null }) {
    return this.request<{
      id: string;
      key: string;
      name: string;
      description: string;
      isSystem: boolean;
      permissions: Array<{
        id: string;
        key: string;
        name: string;
        description: string;
        isOrganizationLevel: boolean;
      }>;
    }>(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: data.name, description: data.description ?? undefined }),
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.request<void>(`/roles/${roleId}`, { method: 'DELETE' });
  }

  async updateRolePermissions(roleId: string, permissionKeys: string[]) {
    return this.request<{
      id: string;
      key: string;
      name: string;
      description: string;
      isSystem: boolean;
      permissions: Array<{
        id: string;
        key: string;
        name: string;
        description: string;
        isOrganizationLevel: boolean;
      }>;
    }>(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionKeys }),
    });
  }

  async getUserAssignments(userId: string) {
    return this.request<{
      userId: string;
      assignments: Array<{
        id: string;
        userId: string;
        roleDefinitionId: string;
        roleKey: string;
        roleName: string;
        scopeType: 'organization' | 'brand';
        scopeId?: string | null;
      }>;
      effectivePermissions: {
        organizationPermissionKeys: string[];
        brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
      };
    }>(`/users/${userId}/assignments`);
  }

  async updateUserAssignments(
    userId: string,
    assignments: Array<{
      roleDefinitionId: string;
      scopeType: 'organization' | 'brand';
      scopeId?: string | null;
    }>
  ) {
    return this.request<{
      userId: string;
      assignments: Array<{
        id: string;
        userId: string;
        roleDefinitionId: string;
        roleKey: string;
        roleName: string;
        scopeType: 'organization' | 'brand';
        scopeId?: string | null;
      }>;
      effectivePermissions: {
        organizationPermissionKeys: string[];
        brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
      };
    }>(`/users/${userId}/assignments`, {
      method: 'PUT',
      body: JSON.stringify({ assignments }),
    });
  }

  async updateBrand(
    id: string,
    data: {
      name?: string | null;
      domain?: string | null;
      subdomain?: string | null;
      logo?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      globalCss?: string | null;
      customFontUrls?: string[] | null;
    }
  ) {
    return this.request<{
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      globalCss?: string;
      customFontUrls: string[];
      createdAt: string;
      updatedAt: string;
    }>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pages endpoints
  async getPages(brandId?: string) {
    const query = brandId ? `?brandId=${brandId}` : '';
    return this.request<Array<{
      id: string;
      brandId: string;
      name: string;
      uri: string;
      isDynamic: boolean;
      dynamicVariables: string[];
      status: string;
      seo: {
        title: string;
        description: string;
        keywords: string[];
      };
      layoutId: string;
      bodyContent: string;
      themeId?: string;
      version: string;
      createdAt: string;
      updatedAt: string;
    }>>(`/pages${query}`);
  }

  async getPage(id: string) {
    return this.request<{
      id: string;
      brandId: string;
      name: string;
      uri: string;
      isDynamic: boolean;
      dynamicVariables: string[];
      status: string;
      seo: {
        title: string;
        description: string;
        keywords: string[];
      };
      layoutId: string;
      bodyContent: string;
      themeId?: string;
      version: string;
      createdAt: string;
      updatedAt: string;
    }>(`/pages/${id}`);
  }

  async getPageByUri(brandKey: string, uri: string) {
    const normalizedUri = encodeURIComponent(uri);
    return this.request<{
      id: string;
      brandId: string;
      name: string;
      uri: string;
      isDynamic: boolean;
      dynamicVariables: string[];
      status: string;
      seo: {
        title: string;
        description: string;
        keywords: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        noIndex?: boolean;
        noFollow?: boolean;
      };
      layoutId: string;
      bodyContent: string;
      themeId?: string;
      layoutConfigJson?: string;
      customCss?: string;
      version: string;
      publishedRevisionId?: string;
      draftRevisionId?: string;
      createdAt: string;
      updatedAt: string;
      publishedAt?: string;
      createdBy?: string;
      updatedBy?: string;
    }>(`/pages/by-uri?brandIdOrSlug=${brandKey}&uri=${normalizedUri}`);
  }

  async createPage(data: {
    brandId: string;
    name: string;
    uri: string;
    isDynamic?: boolean;
    dynamicVariables?: string[];
    layoutId: string;
    bodyContent?: string;
    themeId?: string;
  }) {
    return this.request<{ id: string }>('/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: Record<string, unknown>) {
    return this.request(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPageRevisions(pageId: string) {
    return this.request<Array<{ id: string; pageId: string; createdAt: string; createdBy: string }>>(
      `/pages/${pageId}/revisions`
    );
  }

  async getPageRevision(pageId: string, revisionId: string) {
    return this.request<{
      id: string;
      pageId: string;
      bodyContent: string;
      seo: Record<string, unknown>;
      themeId?: string | null;
      layoutConfigJson?: string | null;
      customCss?: string | null;
      createdAt: string;
      createdBy: string;
    }>(`/pages/${pageId}/revisions/${revisionId}`);
  }

  async publishPage(id: string, payload: { version: string; revisionId?: string }) {
    return this.request(`/pages/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deletePage(id: string) {
    return this.request(`/pages/${id}`, {
      method: 'DELETE',
    });
  }

  // Widgets endpoints — single row shape shared by list and get-by-id
  async getWidgets(brandId?: string) {
    const query = brandId ? `?brandId=${brandId}` : '';
    return this.request<WidgetDefinitionApiRow[]>(`/widgets${query}`);
  }

  async getWidget(id: string) {
    return this.request<WidgetDefinitionApiRow>(`/widgets/${encodeURIComponent(id)}`);
  }

  async getWidgetVersions(slug: string) {
    return this.request<Array<{
      id: string;
      version: string;
      changeLog?: string;
      isLatest: boolean;
      isDeprecated: boolean;
      createdAt: string;
    }>>(`/widgets/${slug}/versions`);
  }

  async getWidgetVersion(slug: string, version: string) {
    return this.request<{
      id: string;
      slug: string;
      version: string;
      name: string;
      description: string;
      configSchema: string;
      defaultConfig: string;
      defaultStyles?: {
        backgroundColor?: string;
        textColor?: string;
        padding: string;
        margin: string;
        borderRadius: number;
        borderWidth: number;
        borderColor?: string;
        shadow: string;
        opacity: number;
        textAlign?: string;
        customClasses?: string;
      };
      changeLog?: string;
      isLatest: boolean;
      isDeprecated: boolean;
      createdAt: string;
    }>(`/widgets/${slug}/versions/${version}`);
  }

  async getAllWidgetVersions(slug: string) {
    return this.request<Array<{
      id: string;
      slug: string;
      version: string;
      name: string;
      description: string;
      configSchema: string;
      defaultConfig: string;
      defaultStyles?: {
        backgroundColor?: string;
        textColor?: string;
        padding: string;
        margin: string;
        borderRadius: number;
        borderWidth: number;
        borderColor?: string;
        shadow: string;
        opacity: number;
        textAlign?: string;
        customClasses?: string;
      };
      changeLog?: string;
      isLatest: boolean;
      isDeprecated: boolean;
      createdAt: string;
    }>>(`/widgets/${slug}/versions/all`);
  }

  // Themes endpoints
  async getThemes(brandId?: string) {
    const query = brandId ? `?brandId=${brandId}` : '';
    return this.request<Array<{
      id: string;
      name: string;
      colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
      };
      fonts: {
        heading: string;
        body: string;
      };
      isDefault: boolean;
      brandId?: string;
    }>>(`/themes${query}`);
  }

  // Site Layouts endpoints
  async getSiteLayouts(brandId?: string) {
    const query = brandId ? `?brandId=${brandId}` : '';
    return this.request<Array<{
      id: string;
      brandId: string;
      name: string;
      isDefault: boolean;
      header: string;
      footer: string;
      sidebar?: string;
    }>>(`/site-layouts${query}`);
  }

  // Site settings
  async getSiteSettings(brandKey: string) {
    return this.request<{
      id: string;
      brandId: string;
      siteName: string;
      siteDescription: string;
      favicon: string;
      ogImage: string;
      showNavigation: boolean;
      navigationPosition: string;
      navigationStyle: string;
      showLogo: boolean;
      logoUrl: string;
      enableSearch: boolean;
      googleAnalyticsId: string;
      customHeadCode: string;
      enableSocialSharing: boolean;
      twitterHandle: string;
      customDomain: string;
      robotsTxt: string;
      canonicalUrl: string;
      globalCss?: string;
      headScripts?: string;
      bodyScripts?: string;
      supportedLangs?: string[];
      updatedAt: string;
    }>(`/site-settings?brandIdOrSlug=${brandKey}`);
  }

  async updateSiteSettings(id: string, payload: Record<string, unknown>) {
    return this.request(`/site-settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Templates
  async getTemplates(brandId?: string) {
    const query = brandId ? `?brandId=${brandId}` : '';
    return this.request<Array<{
      id: string;
      name: string;
      description: string;
      brandId?: string;
      bodyContent: string;
      thumbnail?: string;
      category?: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
    }>>(`/templates${query}`);
  }

  // Page data (variables + api calls)
  async getPageData(pageId: string) {
    return this.request<{
      variables: Array<{ name: string; value: string; source: string }>;
      apiCalls: Array<Record<string, unknown>>;
    }>(`/page-data/${pageId}`);
  }

  // Audit logs
  async getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string }) {
    const query = new URLSearchParams();
    if (filters?.entityType) query.append('entityType', filters.entityType);
    if (filters?.entityId) query.append('entityId', filters.entityId);
    if (filters?.userId) query.append('userId', filters.userId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request<Array<{
      id: string;
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      details: Record<string, unknown>;
      createdAt: string;
    }>>(`/auditlogs${suffix}`);
  }
}

// Export singleton instance (browser token storage so login/session restore work)
export const apiClient = new ApiClient(API_BASE_URL, browserTokenStorage);

// Public API client for server-side requests that don't require authentication
// (e.g., public preview pages); uses noop storage so server never touches localStorage
export const publicApiClient = new ApiClient(API_BASE_URL, noopTokenStorage);

// Export flag for checking if mock data should be used
export const useMockData = USE_MOCK_DATA;

