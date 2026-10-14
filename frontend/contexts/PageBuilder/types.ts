import type {
  Page,
  WidgetStyles,
  PageLayoutConfig,
  PageSection,
  DataBinding,
  Action,
  SiteLayout,
  SiteSettings,
  ResponsiveSpan,
  VisibilityRule,
  WidgetDefinition,
} from '@/types/cms';

export interface ThemeConfig {
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
}

export interface PageBuilderContextType {
  // Pages
  currentPage: Page | null;
  setCurrentPage: (page: Page | null) => void;
  pages: Page[];
  refreshPages: () => void;
  isLoading: boolean;

  // Widget Definitions
  widgetDefinitions: WidgetDefinition[];

  // Widgets
  selectedWidgetId: string | null;
  selectWidget: (widgetId: string | null) => void;
  addWidget: (widgetDefinitionId: string, config?: Record<string, unknown>, sectionId?: string, columnId?: string) => void;
  removeWidget: (widgetInstanceId: string) => void;
  updateWidgetConfig: (widgetInstanceId: string, config: Record<string, unknown>) => void;
  updateWidgetStyles: (widgetInstanceId: string, styles: Partial<WidgetStyles>) => void;
  updateWidgetVersion: (widgetInstanceId: string, newVersion: string, newConfig?: Record<string, unknown>, newStyles?: Partial<WidgetStyles>) => void;
  updateWidgetVisibilityRules: (widgetInstanceId: string, rules: VisibilityRule[]) => void;
  duplicateWidget: (widgetInstanceId: string) => void;
  toggleWidgetVisibility: (widgetInstanceId: string) => void;

  // Sections
  selectedSectionId: string | null;
  selectSection: (sectionId: string | null) => void;
  addSection: (layout?: string, afterSectionId?: string) => void;
  removeSection: (sectionId: string) => void;
  updateSectionLayout: (sectionId: string, layout: PageSection['layout']) => void;
  updateSectionStyles: (sectionId: string, styles: Partial<PageSection['styles']>) => void;
  moveSection: (sectionId: string, targetIndex: number) => void;

  // Columns
  selectedColumnId: string | null;
  selectColumn: (columnId: string | null) => void;
  addColumn: (sectionId: string, span?: ResponsiveSpan) => void;
  removeColumn: (sectionId: string, columnId: string) => void;
  updateColumnSpan: (sectionId: string, columnId: string, span: ResponsiveSpan) => void;
  moveWidgetToColumn: (widgetId: string, targetSectionId: string, targetColumnId: string, targetPosition?: number) => void;
  moveWidgetUp: (widgetInstanceId: string, sectionId: string, columnId: string) => void;
  moveWidgetDown: (widgetInstanceId: string, sectionId: string, columnId: string) => void;
  reorderWidgetsInColumn: (sectionId: string, columnId: string, activeId: string, overId: string) => void;

  // Layouts
  siteLayouts: SiteLayout[];
  currentLayout: SiteLayout | null;
  setPageLayout: (layoutId: string) => void;

  // Site Layout Widgets
  selectedSiteLayoutWidgetId: string | null;
  selectedSiteLayoutSection: 'header' | 'footer' | null;
  selectSiteLayoutWidget: (widgetId: string | null, section: 'header' | 'footer') => void;
  updateSiteLayoutWidgetConfig: (widgetId: string, section: 'header' | 'footer', config: Record<string, unknown>) => void;
  updateSiteLayoutWidgetStyles: (widgetId: string, section: 'header' | 'footer', styles: Partial<WidgetStyles>) => void;
  addSiteLayoutWidget: (section: 'header' | 'footer', widgetDefinitionId: string) => void;
  removeSiteLayoutWidget: (section: 'header' | 'footer', widgetId: string) => void;
  replaceSiteLayoutWidget: (section: 'header' | 'footer', existingWidgetId: string, newWidgetDefinitionId: string) => void;
  duplicateSiteLayoutWidget: (section: 'header' | 'footer', widgetId: string) => void;
  reorderSiteLayoutWidgets: (section: 'header' | 'footer', activeId: string, overId: string) => void;

  // Data Bindings
  addDataBinding: (widgetId: string, binding: DataBinding) => void;
  removeDataBinding: (widgetId: string, bindingId: string) => void;
  updateDataBinding: (widgetId: string, bindingId: string, updates: Partial<DataBinding>) => void;

  // Actions
  addAction: (widgetId: string, actionName: string, action: Action) => void;
  removeAction: (widgetId: string, actionName: string) => void;
  updateAction: (widgetId: string, actionName: string, updates: Partial<Action>) => void;

  // Page Layout & Custom CSS
  updatePageLayoutConfig: (layoutConfig: PageLayoutConfig) => void;
  updatePageCss: (customCss: string) => void;

  // SEO
  updatePageSeo: (seoUpdates: Partial<Page['seo']>) => void;

  // Page Metadata
  updatePageName: (name: string) => void;
  updatePageUri: (uri: string) => void;
  updatePageStatus: (status: Page['status']) => void;
  updatePageDynamicVariables: (variables: string[]) => void;

  // Save & Publish
  savePage: () => void;
  saveSiteLayout: () => Promise<void>;
  publishCurrentPage: (version: string, revisionId?: string) => void;
  revertToPublishedVersion: () => void;
  isDirty: boolean;
  isLayoutDirty: boolean;
  isPreviewMode: boolean;
  setPreviewMode: (preview: boolean) => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void;

  // Theme - from API and synced to page
  themes: ThemeConfig[];
  activeTheme: ThemeConfig;
  setActiveTheme: (theme: ThemeConfig) => void;

  // Site settings (per brand) – used for supported langs in widget i18n
  siteSettings: SiteSettings | null;
  supportedLangs: string[];

  // Version
  pageVersion: string;

  // Version dialogs (shared so sidebar and properties panel can open them)
  versionDialogPage: Page | null;
  setVersionDialogPage: (page: Page | null) => void;
  editVersionDialogPage: Page | null;
  setEditVersionDialogPage: (page: Page | null) => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}
