// User roles
export type UserRole = 'admin' | 'content_team' | 'engineer';

/** Snapshot from auth API for RBAC-aware UI gates. */
export interface EffectivePermissionsSnapshot {
  organizationPermissionKeys: string[];
  brandPermissionSets: Array<{ brandId: string; permissionKeys: string[] }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  brandIds: string[];
  createdAt: Date;
  updatedAt?: Date;
  /** Present when API returns RBAC effective permissions (login /auth/me). */
  effectivePermissions?: EffectivePermissionsSnapshot | null;
}

/** Admin list user (API returns role as PascalCase: Admin, ContentTeam, Engineer). */
export interface ListUser {
  id: string;
  email: string;
  name: string;
  role: string;
  brandIds: string[];
  createdAt: string;
}

export interface RbacPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  isOrganizationLevel: boolean;
}

export interface RbacRoleDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RbacPermission[];
}

// Brand with global CSS support
export interface Brand {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  globalCss?: string;           // Brand-wide custom CSS (raw CSS string)
  customFontUrls?: string[];    // Additional custom font URLs
  createdAt: Date;
  updatedAt: Date;
}

// Script configuration for head/body injection
export interface ScriptConfig {
  id: string;
  name: string;
  src?: string;          // External script URL
  content?: string;      // Inline script content
  async?: boolean;
  defer?: boolean;
  position: 'head' | 'body-start' | 'body-end';
  enabled: boolean;
}

// System configuration for spacing and shadows
export interface SystemStyleConfig {
  spacing: {
    padding: Record<string, string>;
    margin: Record<string, string>;
    borderRadius: Record<string, string>;
    gap: Record<string, string>;
  };
  shadows: Record<string, string>;
}

// Page status
export type PageStatus = 'draft' | 'published' | 'disabled';

// Page Layout Configuration
export interface PageLayoutConfig {
  maxWidth: 'full' | 'xl' | 'lg' | 'md';
  containerPadding: 'none' | 'sm' | 'md' | 'lg';
  defaultBackground: string;
}

// Responsive span configuration
export interface ResponsiveSpan {
  mobile: number; // 1-12
  tablet: number; // 1-12
  desktop: number; // 1-12
}

// Responsive spacing configuration
export interface ResponsiveSpacing {
  mobile?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  tablet?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  desktop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

// Section styles for section-level styling
export interface SectionStyles {
  backgroundColor?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing;
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing;
  fullWidth?: boolean;
  containerMaxWidth?: 'full' | 'xl' | 'lg' | 'md';
}

// Page Column - holds widgets within a section
export interface PageColumn {
  id: string;
  span: ResponsiveSpan; // Responsive span configuration (1-12 per breakpoint)
  widgets: WidgetInstance[];
}

// Page Section - contains columns for grid layout
export interface PageSection {
  id: string;
  type: 'section';
  layout: '1-col' | '2-col' | '3-col' | '4-col' | 'left-sidebar' | 'right-sidebar' | 'flex-grid';
  styles?: SectionStyles;
  columns: PageColumn[];
}

// Site Layout - global header/footer shared across pages
export interface SiteLayout {
  id: string;
  brandId: string;
  name: string;
  isDefault?: boolean;
  header: WidgetInstance[];
  footer: WidgetInstance[];
  sidebar?: WidgetInstance[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Page Revision - stores draft and published versions separately
export interface PageRevision {
  id: string;
  pageId: string;
  layoutData: PageSection[]; // The actual page content structure
  seo: PageSEO;
  themeId?: string;
  layoutConfig?: PageLayoutConfig;
  customCss?: string;
  createdAt: Date;
  createdBy: string;
}

/** Summary of a page revision from GET /pages/{id}/revisions (for version history list). */
export interface PageRevisionDto {
  id: string;
  pageId: string;
  createdAt: string;
  createdBy: string;
}

/** Full content of a single revision from GET /pages/{pageId}/revisions/{revisionId} (for loading into editor). */
export interface PageRevisionDetailDto {
  id: string;
  pageId: string;
  bodyContent: string;
  seo: PageSEO;
  themeId?: string | null;
  layoutConfigJson?: string | null;
  customCss?: string | null;
  createdAt: string;
  createdBy: string;
}

// Page Snapshot for versioning (deprecated, use PageRevision instead)
export interface PageSnapshot {
  version: number;
  widgets: WidgetInstance[];
  seo: PageSEO;
  themeId: string;
  layoutConfig?: PageLayoutConfig;
  customCss?: string;
  publishedAt: Date;
  publishedBy: string;
}

// Data Binding - explicit connection between API data and widget properties
export interface DataBinding {
  id: string;
  targetProp: string; // e.g., "title" in the Widget Config
  sourceType: 'variable' | 'api_response';
  sourceId: string;   // e.g., 'api-1' or 'VAR_NAME'
  sourcePath: string; // e.g., 'data.attributes.hotel_name' using dot notation
  // Data transformation support
  transform?: {
    type: 'format_date' | 'format_number' | 'format_currency' | 'concatenate' | 'substring' | 'uppercase' | 'lowercase' | 'default_value' | 'custom';
    params?: Record<string, unknown>;
    customFunction?: string; // JavaScript expression
  };
  // Default/fallback value
  defaultValue?: unknown;
}

// Action - defines what happens when user interacts with widget
export interface Action {
  type: 'navigate' | 'scroll' | 'trigger_api' | 'open_modal';
  payload: {
    url?: string;           // For navigate
    targetId?: string;       // For scroll or modal
    apiCallId?: string;      // For trigger_api
    method?: 'GET' | 'POST'; // For trigger_api
  };
}

// Page
export interface Page {
  id: string;
  brandId: string;
  name: string;
  uri: string;
  isDynamic: boolean;
  dynamicVariables: string[];
  status: PageStatus;
  seo: PageSEO;
  layoutId: string; // References SiteLayout
  bodyContent: PageSection[]; // Replaces widgets - the main page content
  // New fields for full configuration
  themeId?: string; // Associated theme
  layoutConfig?: PageLayoutConfig; // Page-level layout settings
  customCss?: string; // Custom CSS for this page
  version: string; // Semantic version (e.g. "1.0.0")
  publishedRevisionId?: string | null; // Points to the live version
  draftRevisionId: string; // Points to the work-in-progress
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy: string;
  routeParams?: Record<string, string>;
}

export interface PageDto {
  id: string;
  brandId: string;
  name: string;
  uri: string;
  isDynamic: boolean;
  dynamicVariables: string[];
  status: string;
  seo: PageSEO;
  layoutId: string;
  bodyContent: string;
  themeId?: string;
  layoutConfigJson?: string;
  customCss?: string;
  version: string;
  publishedRevisionId?: string | null;
  draftRevisionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  routeParams?: Record<string, string>;
}

// Raw DTOs used by cmsApiService
export interface BrandDto {
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
}

export interface WidgetDto {
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
  } | string;
  brandIds?: string[];
  isAdvanced: boolean;
  /** From API: widget may expose SSR HTML embed when a matching template exists. */
  supportsHtmlEmbed?: boolean;
  latestVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetVersionDto {
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
  } | string;
  changeLog?: string;
  isLatest: boolean;
  isDeprecated: boolean;
  createdAt: string;
}

export interface WidgetVersionListItemDto {
  id: string;
  version: string;
  changeLog?: string;
  isLatest: boolean;
  isDeprecated: boolean;
  createdAt: string;
}

export interface ThemeDto {
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
  fontConfig?: {
    heading: {
      family: string;
      weights: number[];
      fallbacks: string[];
      source: 'google' | 'custom' | 'system';
      url?: string;
    };
    body: {
      family: string;
      weights: number[];
      fallbacks: string[];
      source: 'google' | 'custom' | 'system';
      url?: string;
    };
  };
  isDefault: boolean;
  brandId?: string;
}

export interface SiteLayoutDto {
  id: string;
  brandId: string;
  name: string;
  isDefault: boolean;
  header: string;
  footer: string;
  sidebar?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SystemConfigDto {
  spacing: {
    padding: Record<string, string>;
    margin: Record<string, string>;
    borderRadius: Record<string, string>;
    gap: Record<string, string>;
  };
  shadows: Record<string, string>;
  widgetCategories: WidgetCategoryDefinition[];
}

/** Aligns with Cms.Domain.Enums.MediaStorageProvider */
export type MediaStorageProvider = 0 | 1 | 2;

export interface MediaItemDto {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  type: 'image' | 'video' | 'document';
  size: number;
  brandId: string;
  folder: string;
  alt?: string;
  uploadedBy: string;
  uploadedAt: string;
  storageProvider: MediaStorageProvider;
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    brandIds: string[];
    effectivePermissions?: EffectivePermissionsSnapshot | null;
  };
}

export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// ============= RESPONSIVE STYLES =============

/** A value that can be the same across all breakpoints, or breakpoint-specific. */
export type Responsive<T> = T | { mobile?: T; tablet?: T; desktop?: T };

/** Custom box shadow definition. */
export interface CustomShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

// Widget styles that can be configured
export interface WidgetStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: Responsive<'none' | 'sm' | 'md' | 'lg' | 'xl'>;
  margin?: Responsive<'none' | 'sm' | 'md' | 'lg' | 'xl'>;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: Responsive<'none' | 'sm' | 'md' | 'lg' | 'xl'> | CustomShadow;
  opacity?: number;
  // Additional style options
  textAlign?: 'left' | 'center' | 'right';
  customClasses?: string;
  // Responsive overrides for background and text color
  responsiveBackgroundColor?: { mobile?: string; tablet?: string; desktop?: string };
  responsiveTextColor?: { mobile?: string; tablet?: string; desktop?: string };
}

// Widget definition (created by engineers)
export interface WidgetDefinition {
  id: string;
  slug: string; // Human-readable identifier for custom renderer lookup (e.g., "widget-navbar")
  name: string;
  category: WidgetCategory;
  description: string;
  icon: string;
  version: string;
  thumbnail?: string;
  configSchema: WidgetConfigSchema;
  defaultConfig: Record<string, unknown>;
  defaultStyles?: WidgetStyles;
  brandIds?: string[]; // Empty means available to all
  isAdvanced: boolean;
  /** When true, HTML embed may be offered (requires SSR template in embedRenderers). */
  supportsHtmlEmbed: boolean;
  latestVersionId?: string; // Reference to the latest version
  createdAt: Date;
  updatedAt: Date;
}

// Full widget version details
export interface WidgetDefinitionVersion {
  id: string;
  slug: string;
  version: string;
  name: string;
  description: string;
  configSchema: WidgetConfigSchema;
  defaultConfig: Record<string, unknown>;
  defaultStyles?: WidgetStyles;
  changeLog?: string;
  isLatest: boolean;
  isDeprecated: boolean;
  createdAt: Date;
}

// Summary version info for dropdowns and lists
export interface WidgetVersionListItem {
  id: string;
  version: string;
  changeLog?: string;
  isLatest: boolean;
  isDeprecated: boolean;
  createdAt: Date;
}

export type WidgetCategory = 'layout' | 'content' | 'media' | 'interactive' | 'navigation';

// ============= SCHEMA v2: CONDITION ENGINE =============

export type ConditionOperator = 'eq' | 'neq' | 'in' | 'nin' | 'truthy' | 'falsy' | 'regex' | 'gt' | 'lt';

/** A leaf condition: compares one config field against a value. */
export interface SimpleCondition {
  field: string;
  op: ConditionOperator;
  value?: unknown;
}

/** A compound condition: all sub-conditions must be true (AND), or any must be true (OR). */
export interface CompoundCondition {
  all?: Condition[];
  any?: Condition[];
}

/** A condition tree node — either a leaf comparison or a logical AND/OR group. */
export type Condition = SimpleCondition | CompoundCondition;

// Styleable element definition for widget-level element styling
export interface StyleableElement {
  name: string;
  label: string;
  defaultStyles?: Record<string, string>;
  /**
   * Which CSS properties this element exposes in ElementStylesEditor.
   * If omitted all standard properties are shown.
   */
  allowedProperties?: Array<
    | 'color'
    | 'backgroundColor'
    | 'fontSize'
    | 'fontWeight'
    | 'padding'
    | 'borderRadius'
    | 'margin'
    | 'letterSpacing'
    | 'lineHeight'
    | 'textTransform'
    | 'border'
  >;
}

export interface WidgetConfigSchema {
  fields: WidgetConfigField[];
  styleableElements?: StyleableElement[];
  /** Named groups that fields can belong to, rendered as collapsible sections. */
  groups?: Array<{ key: string; label: string; defaultOpen?: boolean; order?: number }>;
  /** Override which tabs are shown in the Properties panel for this widget. */
  tabs?: Array<{ key: string; label: string; when?: Condition }>;
}

export interface WidgetConfigField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'number'
    | 'toggle'
    | 'select'
    | 'media'
    | 'color'
    | 'data-binding'
    | 'array'
    | 'action'
    | 'localizedText'
    | 'iconPicker'
    | 'linkPicker'
    | 'dimension'
    | 'themeColor'
    | 'gradient'
    | 'json'
    | 'code'
    | 'dateTime'
    | 'range';
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  placeholder?: string;
  helpText?: string;
  /** For localizedText: which langs to show in the builder (e.g. ['en-GB', 'fr-FR']). */
  langs?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  // For array type - define the shape of each item
  arrayItemSchema?: WidgetConfigField[];

  // ---- Schema v2 additions ----

  /** Key of the group (from WidgetConfigSchema.groups) this field belongs to. */
  group?: string;
  /** Explicit rendering order within its group (lower = first). */
  order?: number;
  /**
   * Field is only visible when this condition is true.
   * Evaluated against the current widget config object.
   */
  visibleWhen?: Condition;
  /**
   * Field is disabled (read-only) when this condition is true.
   * Evaluated against the current widget config object.
   */
  disabledWhen?: Condition;
  /**
   * Shorthand: hide this field when the named sibling field has a non-empty value.
   * Equivalent to `visibleWhen: { field: X, op: 'falsy' }`.
   */
  hiddenIfFieldHasValue?: string;
  /** Which Properties tab this field belongs to; defaults to 'content'. */
  tab?: 'content' | 'style' | string;
  /** Default CSS unit for dimension/number fields. */
  unit?: 'px' | 'rem' | '%';
  /**
   * Key of a custom renderer registered via widgetPropertyRegistry.
   * When set, WidgetFieldRenderer delegates to the registry before the built-in switch.
   */
  component?: string;
  /** For data-binding type: restrict which page API call IDs are offered. */
  dataBindingSources?: string[];
}

// Menu item structure for navigation widgets
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  icon?: string;
  children?: MenuItem[];
}

// Widget instance on a page
export interface WidgetInstance {
  id: string;
  widgetDefinitionId: string;
  widgetVersion: string; // Required: tracks which version of widget definition is used
  config: Record<string, unknown>; // Static default values, may include elementStyles: Record<string, Record<string, string>>
  styles?: WidgetStyles;
  order: number;
  isVisible: boolean;
  visibilityRules?: VisibilityRule[];
  // Overrides static config with dynamic data
  dataBindings?: DataBinding[];
  // Actions for interactive widgets (e.g., button onClick)
  actions?: Record<string, Action>; // Key is the action name (e.g., 'onClick', 'onHover')
}

export interface VisibilityRule {
  type: 'device' | 'auth' | 'date' | 'url-param';
  condition: string;
  value: string;
}

// Template
export interface Template {
  id: string;
  name: string;
  description: string;
  brandId?: string; // Empty means global
  bodyContent: PageSection[]; // Updated to use sections instead of flat widgets
  thumbnail?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Page Data (API calls and variables)
export interface PageData {
  variables: PageVariable[];
  apiCalls: ApiCall[];
}

export interface PageVariable {
  name: string;
  value: string;
  source: 'static' | 'url' | 'api';
}

/**
 * API Call Configuration
 * 
 * SECURITY NOTICE:
 * API calls are stored in page configurations and may be exposed client-side.
 * Only public APIs without authentication should be configured here.
 * 
 * For authenticated APIs, use a backend proxy service that:
 * - Stores credentials server-side
 * - Validates requests
 * - Forwards to the actual API endpoint
 */
export interface ApiCall {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * HTTP Headers
   * WARNING: Only use standard, public-safe headers.
   * Do not include: Authorization, API keys, Bearer tokens, etc.
   */
  headers?: Record<string, string>;
  
  /**
   * Query parameters or POST body parameters
   * Can use template variables like {{VARIABLE_NAME}}
   */
  params?: Record<string, string>;
  
  /**
   * Request body (JSON string for POST/PUT/PATCH)
   * Can use template variables like {{VARIABLE_NAME}}
   */
  body?: string;
  
  /**
   * Authentication configuration
   * @deprecated Only 'none' is allowed for security reasons.
   * Use a backend proxy for authenticated API calls.
   */
  auth?: {
    type: 'none' | 'bearer' | 'api_key' | 'basic';
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    username?: string;
    password?: string;
  };
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Enable response caching
   */
  cacheEnabled?: boolean;
  
  /**
   * Cache duration in seconds
   */
  cacheDuration?: number;

  /**
   * Route this call through the secure backend proxy.
   * When true, sensitive headers (Authorization) should be set server-side via credentialKey.
   */
  useProxy?: boolean;

  /**
   * Optional credential key configured on the server to inject secrets.
   */
  credentialKey?: string;

  /**
   * Optional base URL key configured on the server.
   */
  baseUrlKey?: string;
}

// Media Library Item
export interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  type: 'image' | 'video' | 'document';
  size: number;
  brandId: string;
  folder: string;
  alt?: string;
  uploadedBy: string;
  uploadedAt: Date;
  storageProvider: MediaStorageProvider;
}

// Redirect
export interface Redirect {
  id: string;
  from: string;
  to: string;
  brandId: string;
  status: 301 | 302;
  createdAt?: Date;
  updatedAt?: Date;
}

// Audit log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'page' | 'widget' | 'template' | 'brand' | 'user' | 'media' | 'redirect' | 'settings';
  entityId: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

// Complete page export for external rendering service
// This is the COMPLETE data structure that the backend render engine needs
export interface PageExport {
  page: Page;
  
  // Full theme definition for complete styling
  theme: {
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
    fontConfig?: {
      heading: {
        family: string;
        weights: number[];
        fallbacks: string[];
        source: 'google' | 'custom' | 'system';
        url?: string;
      };
      body: {
        family: string;
        weights: number[];
        fallbacks: string[];
        source: 'google' | 'custom' | 'system';
        url?: string;
      };
    };
  };
  
  widgetDefinitions: WidgetDefinition[];
  
  // Complete site settings including scripts
  siteSettings: {
    siteName: string;
    siteDescription: string;
    favicon: string;
    ogImage: string;
    showNavigation: boolean;
    navigationPosition: 'top' | 'side';
    navigationStyle: 'standard' | 'compact' | 'transparent';
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
    // NEW: Global CSS and scripts
    globalCss?: string;
    headScripts?: ScriptConfig[];
    bodyScripts?: ScriptConfig[];
  };
  
  // Brand with global CSS
  brand: Brand;
  
  // Page data for dynamic content
  pageData: {
    variables: PageVariable[];
    apiCalls: ApiCall[];
  };
  
  // Site layout for header/footer
  siteLayout?: SiteLayout;
  
  // NEW: System-level style tokens for backend rendering
  systemConfig: SystemStyleConfig;
  
  // NEW: Pre-computed font URLs for easy loading
  fontUrls: string[];
}

// ============= WIDGET CATEGORIES =============
export interface WidgetCategoryDefinition {
  id: WidgetCategory;
  name: string;
  icon: string;
  description: string;
  order: number;
}

// ============= SITE SETTINGS =============
export interface SiteSettings {
  id: string;
  brandId: string;
  siteName: string;
  siteDescription: string;
  favicon: string;
  ogImage: string;
  showNavigation: boolean;
  navigationPosition: 'top' | 'side';
  navigationStyle: 'standard' | 'compact' | 'transparent';
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
  // NEW: Global CSS and script injection
  globalCss?: string;
  headScripts?: ScriptConfig[];
  bodyScripts?: ScriptConfig[];
  /** Supported language codes for widget i18n (e.g. ["en-GB", "fr-FR"]). Managed in Site Settings. */
  supportedLangs?: string[];
  /** Brand-level saved colour swatches available in the Style tab picker. */
  savedColors?: string[];
  updatedAt: Date;
}

// ============= THEME DEFINITIONS =============
export interface FontConfig {
  family: string;
  weights: number[];
  fallbacks: string[];
  source: 'google' | 'custom' | 'system';
  url?: string; // For custom fonts
}

export interface ThemeDefinition {
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
  // Extended font configuration for backend independence
  fontConfig?: {
    heading: FontConfig;
    body: FontConfig;
  };
  isDefault?: boolean;
  brandId?: string; // If set, only available to this brand
}

// ============= PAGE DATA CONFIG =============
export interface PageDataConfig {
  id: string;
  pageId: string;
  variables: PageVariable[];
  apiCalls: ApiCall[];
}

// ============= API MOCK DATA COLLECTIONS (for dynamic content widgets) =============
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export interface Destination {
  id: string;
  title: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  link: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TravelPackage {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  rating: number;
  location: string;
}

export interface SimpleDestination {
  id: string;
  name: string;
  type: string;
  featured: boolean;
}
