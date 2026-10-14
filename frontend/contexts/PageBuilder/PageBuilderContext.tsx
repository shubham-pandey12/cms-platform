'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Page, WidgetInstance, WidgetDefinition, SiteLayout, WidgetStyles, SiteSettings } from '@/types/cms';
import { deepClone } from '@/lib/deepClone';
import {
  getPages,
  getPageById,
  updatePage,
  publishPage as publishPageService,
  getThemes,
  resolveThemeForPage,
  getWidgetDefinitions,
  getWidgetDefinitionById,
  addAuditLog,
  getSiteLayouts,
  updateSiteLayout,
  updatePageRevision,
  getSiteSettings,
} from '@/services/cmsApiService';
import { useAuth } from '@/contexts/AuthContext';
import type { PageBuilderContextType, ThemeConfig } from './types';
import { defaultThemeConfig, themeToConfig, normalizeWidgetOrders } from './constants';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { usePageBuilderHistory } from './usePageBuilderHistory';
import { usePageBuilderWidgets } from './usePageBuilderWidgets';
import { usePageBuilderSections } from './usePageBuilderSections';
import { usePageBuilderColumns } from './usePageBuilderColumns';
import { usePageBuilderPageMeta } from './usePageBuilderPageMeta';
import { usePageBuilderDataBindings } from './usePageBuilderDataBindings';
import { usePageBuilderActions } from './usePageBuilderActions';
import { SetPublishedVersionDialog } from '@/components/builder/SetPublishedVersionDialog';
import { EditPageVersionDialog } from '@/components/builder/EditPageVersionDialog';

export const PageBuilderContext = createContext<PageBuilderContextType | undefined>(undefined);

function applyThemeToDocument(theme: ThemeConfig): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-font-heading', theme.fonts.heading);
  root.style.setProperty('--theme-font-body', theme.fonts.body);
}

export function PageBuilderProvider({ children }: { children: ReactNode }) {
  const { selectedBrandId, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPageState] = useState<Page | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [siteLayouts, setSiteLayouts] = useState<SiteLayout[]>([]);
  const [currentLayout, setCurrentLayoutState] = useState<SiteLayout | null>(null);
  const [selectedSiteLayoutWidgetId, setSelectedSiteLayoutWidgetId] = useState<string | null>(null);
  const [selectedSiteLayoutSection, setSelectedSiteLayoutSection] = useState<'header' | 'footer' | null>(null);
  const [isLayoutDirty, setIsLayoutDirty] = useState(false);
  const [widgetDefinitions, setWidgetDefinitions] = useState<WidgetDefinition[]>([]);
  const prevBrandIdRef = useRef<string | null>(null);
  const [themes, setThemes] = useState<ThemeConfig[]>([defaultThemeConfig]);
  const [activeTheme, setActiveThemeState] = useState<ThemeConfig>(defaultThemeConfig);
  const [pageVersion, setPageVersion] = useState<string>('1.0.0');
  const [versionDialogPage, setVersionDialogPage] = useState<Page | null>(null);
  const [editVersionDialogPage, setEditVersionDialogPage] = useState<Page | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const {
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory: resetHistoryState,
  } = usePageBuilderHistory(setCurrentPageState, setIsDirty);

  useEffect(() => {
    const loadThemes = async () => {
      const apiThemes = await getThemes();
      if (apiThemes.length > 0) {
        setThemes(apiThemes.map(themeToConfig));
      }
    };
    loadThemes();
  }, []);

  const refreshPages = useCallback(async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    try {
      const apiPages = await getPages(selectedBrandId);
      setPages(apiPages);
    } catch (error) {
      console.error('Failed to refresh pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    const loadBrandData = async () => {
      if (!selectedBrandId) {
        setCurrentPageState(null);
        setPages([]);
        setSiteLayouts([]);
        setWidgetDefinitions([]);
        setSiteSettings(null);
        prevBrandIdRef.current = null;
        setIsLoading(false);
        return;
      }
      const brandChanged = prevBrandIdRef.current !== selectedBrandId;
      prevBrandIdRef.current = selectedBrandId;
      if (brandChanged) {
        setIsLoading(true);
        try {
          const [apiPages, apiLayouts, apiWidgetDefs, apiSiteSettings] = await Promise.all([
            getPages(selectedBrandId),
            getSiteLayouts(selectedBrandId),
            getWidgetDefinitions(selectedBrandId),
            getSiteSettings(selectedBrandId),
          ]);
          setPages(apiPages);
          setSiteLayouts(apiLayouts);
          setWidgetDefinitions(apiWidgetDefs);
          setSiteSettings(apiSiteSettings ?? null);

          const defaultLayout = apiLayouts.find(l => l.isDefault) || apiLayouts.find(l => l.name === 'Default Layout') || apiLayouts[0];

          const lastPageId = typeof window !== 'undefined' ? localStorage.getItem(`mcms_lastPage_${selectedBrandId}`) : null;
          const lastPage = lastPageId ? apiPages.find(p => p.id === lastPageId) : null;
          const pageToLoad = lastPage || apiPages[0];
          if (pageToLoad) {
            setCurrentPageState(pageToLoad);
            const resolvedTheme = await resolveThemeForPage(pageToLoad.themeId, selectedBrandId, false);
            const themeConfig = resolvedTheme ? themeToConfig(resolvedTheme) : defaultThemeConfig;
            setActiveThemeState(themeConfig);
            applyThemeToDocument(themeConfig);
            const layout = pageToLoad.layoutId
              ? (apiLayouts.find(l => l.id === pageToLoad.layoutId) ?? defaultLayout)
              : defaultLayout;
            if (layout) {
              setCurrentLayoutState(layout);
              const repairedPage = { ...pageToLoad, layoutId: layout.id };
              if (!pageToLoad.layoutId && defaultLayout) {
                setCurrentPageState(repairedPage);
                syncPageToApi(repairedPage);
              } else if (pageToLoad.layoutId && layout.id !== pageToLoad.layoutId) {
                setCurrentPageState(repairedPage);
                syncPageToApi(repairedPage);
              }
            } else {
              setCurrentLayoutState(null);
            }
            resetHistoryState(pageToLoad);
            setPageVersion(pageToLoad.version || '1.0.0');
            if (!lastPage && apiPages.length > 0 && typeof window !== 'undefined') {
              localStorage.setItem(`mcms_lastPage_${selectedBrandId}`, apiPages[0].id);
            }
          } else {
            setCurrentPageState(null);
            setCurrentLayoutState(null);
            resetHistoryState(null);
            setActiveThemeState(defaultThemeConfig);
            applyThemeToDocument(defaultThemeConfig);
          }
          setSelectedWidgetId(null);
          setIsDirty(false);
          setIsLayoutDirty(false);
        } catch (error) {
          console.error('Failed to load brand data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadBrandData();
  }, [selectedBrandId, resetHistoryState]);

  const syncPageToApi = useCallback(async (updatedPage: Page) => {
    await updatePage(updatedPage.id, {
      bodyContent: updatedPage.bodyContent,
      seo: updatedPage.seo,
      themeId: updatedPage.themeId,
      layoutId: updatedPage.layoutId,
      layoutConfig: updatedPage.layoutConfig,
      customCss: updatedPage.customCss,
      name: updatedPage.name,
      uri: updatedPage.uri,
      status: updatedPage.status,
      isDynamic: updatedPage.isDynamic,
      dynamicVariables: updatedPage.dynamicVariables,
    });
    if (updatedPage.draftRevisionId) {
      await updatePageRevision(updatedPage.draftRevisionId, {
        layoutData: deepClone(updatedPage.bodyContent),
        seo: deepClone(updatedPage.seo),
        themeId: updatedPage.themeId,
        layoutConfig: updatedPage.layoutConfig ? deepClone(updatedPage.layoutConfig) : undefined,
        customCss: updatedPage.customCss,
      });
    }
    setPageVersion(updatedPage?.version ?? '1.0.0');
  }, []);

  const widgetsApi = usePageBuilderWidgets({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
    selectedWidgetId,
    setSelectedWidgetId,
    userId: user?.id,
  });

  const sectionsApi = usePageBuilderSections({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
    selectedSectionId,
    setSelectedSectionId,
  });

  const columnsApi = usePageBuilderColumns({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
    selectedColumnId,
    setSelectedColumnId,
  });

  const pageMetaApi = usePageBuilderPageMeta({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
  });

  const dataBindingsApi = usePageBuilderDataBindings({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
  });

  const actionsApi = usePageBuilderActions({
    currentPage,
    setCurrentPageState,
    pushToHistory,
    syncPageToApi,
    setIsDirty,
  });

  const setActiveTheme = useCallback(
    async (theme: ThemeConfig) => {
      setActiveThemeState(theme);
      applyThemeToDocument(theme);
      if (currentPage) {
        const updatedPage: Page = { ...currentPage, themeId: theme.id };
        setCurrentPageState(updatedPage);
        pushToHistory(updatedPage);
        setIsDirty(true);
        addAuditLog(user?.id || 'unknown', 'theme.changed', 'page', currentPage.id, {
          themeName: theme.name,
          themeId: theme.id,
        });
      }
    },
    [currentPage, pushToHistory, user?.id]
  );

  const setPreviewMode = useCallback((preview: boolean) => {
    setIsPreviewMode(preview);
    if (preview) setSelectedWidgetId(null);
  }, []);

  const setCurrentPage = useCallback(
    async (page: Page | null) => {
      if (currentPage && isDirty) {
        await updatePage(currentPage.id, currentPage);
        await refreshPages();
      }
      setCurrentPageState(page);
      setSelectedWidgetId(null);
      setSelectedSiteLayoutWidgetId(null);
      setSelectedSiteLayoutSection(null);
      setIsDirty(false);
      setIsLayoutDirty(false);
      if (page) {
        setPageVersion(page.version || '1.0.0');
        if (page.layoutId) {
          const layout = siteLayouts.find(l => l.id === page.layoutId);
          setCurrentLayoutState(layout ?? null);
        } else setCurrentLayoutState(null);
        const brandIdForTheme = page.brandId ?? selectedBrandId ?? undefined;
        const resolvedTheme = await resolveThemeForPage(page.themeId, brandIdForTheme, false);
        const themeConfig = resolvedTheme ? themeToConfig(resolvedTheme) : defaultThemeConfig;
        setActiveThemeState(themeConfig);
        applyThemeToDocument(themeConfig);
        if (page.brandId && typeof window !== 'undefined') {
          localStorage.setItem(`mcms_lastPage_${page.brandId}`, page.id);
        }
        resetHistoryState(page);
      } else {
        resetHistoryState(null);
        setActiveThemeState(defaultThemeConfig);
        applyThemeToDocument(defaultThemeConfig);
      }
    },
    [currentPage, isDirty, refreshPages, siteLayouts, resetHistoryState, selectedBrandId]
  );

  const selectWidget = useCallback((widgetId: string | null) => {
    setSelectedWidgetId(widgetId);
    if (widgetId) {
      setSelectedSiteLayoutWidgetId(null);
      setSelectedSiteLayoutSection(null);
    }
  }, []);

  const savePage = useCallback(async () => {
    if (!currentPage) return;
    await updatePage(currentPage.id, currentPage);
    await refreshPages();
    setIsDirty(false);
    const widgetCount = (currentPage.bodyContent || []).reduce(
      (count, section) =>
        count + section.columns.reduce((colCount, column) => colCount + column.widgets.length, 0),
      0
    );
    addAuditLog(user?.id || 'unknown', 'page.saved', 'page', currentPage.id, {
      pageName: currentPage.name,
      widgetCount,
      version: currentPage.version,
    });
  }, [currentPage, refreshPages, user?.id]);

  const publishCurrentPage = useCallback(async (version: string, revisionId?: string) => {
    if (!currentPage) return;
    const publishedPage = await publishPageService(currentPage.id, version, revisionId);
    if (publishedPage) {
      setCurrentPageState(publishedPage);
      setPageVersion(publishedPage.version);
      await refreshPages();
      setIsDirty(false);
    }
  }, [currentPage, refreshPages]);

  const revertToPublishedVersion = useCallback(async () => {
    if (!currentPage || !currentPage.publishedRevisionId) return;
    const pageData = await getPageById(currentPage.id);
    if (pageData) {
      setCurrentPageState(pageData);
      pushToHistory(pageData);
      await refreshPages();
      setIsDirty(false);
    }
  }, [currentPage, refreshPages, pushToHistory]);

  const selectSection = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  }, []);

  const selectColumn = useCallback((columnId: string | null) => {
    setSelectedColumnId(columnId);
    setSelectedWidgetId(null);
  }, []);

  const setPageLayout = useCallback(
    async (layoutId: string) => {
      if (!currentPage) return;
      const layout = siteLayouts.find(l => l.id === layoutId);
      if (!layout) return;
      const updatedPage = { ...currentPage, layoutId };
      setCurrentPageState(updatedPage);
      setCurrentLayoutState(layout);
      pushToHistory(updatedPage);
      setIsDirty(true);
    },
    [currentPage, siteLayouts, pushToHistory]
  );

  const applyLayoutChangeLocal = useCallback((updatedLayout: SiteLayout) => {
    setCurrentLayoutState(updatedLayout);
    setSiteLayouts(prev => prev.map(l => (l.id === updatedLayout.id ? updatedLayout : l)));
    setIsLayoutDirty(true);
  }, []);

  const saveSiteLayout = useCallback(async () => {
    if (!currentLayout) return;
    const result = await updateSiteLayout(currentLayout.id, currentLayout);
    if (result) {
      setCurrentLayoutState(result);
      setSiteLayouts(prev => prev.map(l => (l.id === result.id ? result : l)));
      setIsLayoutDirty(false);
    }
  }, [currentLayout]);

  const selectSiteLayoutWidget = useCallback((widgetId: string | null, section: 'header' | 'footer') => {
    setSelectedSiteLayoutWidgetId(widgetId);
    setSelectedSiteLayoutSection(widgetId ? section : null);
    if (widgetId) setSelectedWidgetId(null);
  }, []);

  const addSiteLayoutWidget = useCallback(
    async (section: 'header' | 'footer', widgetDefinitionId: string) => {
      if (!currentLayout) return;
      const widgetDef = await getWidgetDefinitionById(widgetDefinitionId);
      const newWidget: WidgetInstance = {
        id: uuidv4(),
        widgetDefinitionId,
        widgetVersion: widgetDef?.version || '1.0.0',
        config: widgetDef?.defaultConfig || {},
        styles: widgetDef?.defaultStyles || {},
        order: section === 'header' ? currentLayout.header.length : currentLayout.footer.length,
        isVisible: true,
      };
      const updatedLayout = { ...currentLayout, [section]: [...currentLayout[section], newWidget] };
      applyLayoutChangeLocal(updatedLayout);
      addAuditLog(user?.id || 'unknown', 'siteLayout.widget.added', 'settings', currentLayout.id, {
        widgetId: newWidget.id,
        widgetType: widgetDefinitionId,
        section,
      });
    },
    [currentLayout, applyLayoutChangeLocal, user?.id]
  );

  const removeSiteLayoutWidget = useCallback(
    async (section: 'header' | 'footer', widgetId: string) => {
      if (!currentLayout) return;
      const updatedWidgets = currentLayout[section].filter(w => w.id !== widgetId);
      const updatedLayout = { ...currentLayout, [section]: normalizeWidgetOrders(updatedWidgets) };
      if (selectedSiteLayoutWidgetId === widgetId) {
        setSelectedSiteLayoutWidgetId(null);
        setSelectedSiteLayoutSection(null);
      }
      applyLayoutChangeLocal(updatedLayout);
      addAuditLog(user?.id || 'unknown', 'siteLayout.widget.removed', 'settings', currentLayout.id, {
        widgetId,
        section,
      });
    },
    [currentLayout, selectedSiteLayoutWidgetId, applyLayoutChangeLocal, user?.id]
  );

  const replaceSiteLayoutWidget = useCallback(
    async (section: 'header' | 'footer', existingWidgetId: string, newWidgetDefinitionId: string) => {
      if (!currentLayout) return;
      const widgetDef = await getWidgetDefinitionById(newWidgetDefinitionId);
      if (!widgetDef) return;
      const index = currentLayout[section].findIndex(w => w.id === existingWidgetId);
      if (index === -1) return;
      const newWidget: WidgetInstance = {
        id: uuidv4(),
        widgetDefinitionId: widgetDef.id,
        widgetVersion: widgetDef.version || '1.0.0',
        config: widgetDef.defaultConfig || {},
        styles: widgetDef.defaultStyles || {},
        order: index,
        isVisible: true,
      };
      const updatedWidgets = [...currentLayout[section]];
      updatedWidgets[index] = newWidget;
      const updatedLayout = { ...currentLayout, [section]: normalizeWidgetOrders(updatedWidgets) };
      if (selectedSiteLayoutWidgetId === existingWidgetId) {
        setSelectedSiteLayoutWidgetId(newWidget.id);
      }
      applyLayoutChangeLocal(updatedLayout);
      addAuditLog(user?.id || 'unknown', 'siteLayout.widget.replaced', 'settings', currentLayout.id, {
        oldWidgetId: existingWidgetId,
        newWidgetId: newWidget.id,
        widgetType: newWidgetDefinitionId,
        section,
      });
    },
    [currentLayout, selectedSiteLayoutWidgetId, applyLayoutChangeLocal, user?.id]
  );

  const updateSiteLayoutWidgetConfig = useCallback(
    (widgetId: string, section: 'header' | 'footer', config: Record<string, unknown>) => {
      if (!currentLayout) return;
      const updatedWidgets = currentLayout[section].map(w =>
        w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
      );
      applyLayoutChangeLocal({ ...currentLayout, [section]: updatedWidgets });
    },
    [currentLayout, applyLayoutChangeLocal]
  );

  const updateSiteLayoutWidgetStyles = useCallback(
    (widgetId: string, section: 'header' | 'footer', styles: Partial<WidgetStyles>) => {
      if (!currentLayout) return;
      const updatedWidgets = currentLayout[section].map(w =>
        w.id === widgetId ? { ...w, styles: { ...w.styles, ...styles } } : w
      );
      applyLayoutChangeLocal({ ...currentLayout, [section]: updatedWidgets });
    },
    [currentLayout, applyLayoutChangeLocal]
  );

  const duplicateSiteLayoutWidget = useCallback(
    async (section: 'header' | 'footer', widgetId: string) => {
      if (!currentLayout) return;
      const widget = currentLayout[section].find(w => w.id === widgetId);
      if (!widget) return;
      const newWidget: WidgetInstance = { ...widget, id: uuidv4(), order: currentLayout[section].length };
      const updatedLayout = {
        ...currentLayout,
        [section]: normalizeWidgetOrders([...currentLayout[section], newWidget]),
      };
      applyLayoutChangeLocal(updatedLayout);
      addAuditLog(user?.id || 'unknown', 'siteLayout.widget.duplicated', 'settings', currentLayout.id, {
        originalWidgetId: widgetId,
        newWidgetId: newWidget.id,
        section,
      });
    },
    [currentLayout, applyLayoutChangeLocal, user?.id]
  );

  const reorderSiteLayoutWidgets = useCallback(
    async (section: 'header' | 'footer', activeId: string, overId: string) => {
      if (!currentLayout) return;
      const widgets = [...currentLayout[section]];
      const activeWidgetId = activeId.replace(`site-layout-widget-${section}-`, '');
      const overWidgetId = overId.replace(`site-layout-widget-${section}-`, '');
      const activeIndex = widgets.findIndex(w => w.id === activeWidgetId);
      const overIndex = widgets.findIndex(w => w.id === overWidgetId);
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
      const [removed] = widgets.splice(activeIndex, 1);
      widgets.splice(overIndex, 0, removed);
      applyLayoutChangeLocal({ ...currentLayout, [section]: normalizeWidgetOrders(widgets) });
    },
    [currentLayout, applyLayoutChangeLocal]
  );

  const supportedLangs = useMemo(
    () => (siteSettings?.supportedLangs?.length ? siteSettings.supportedLangs : [DEFAULT_LANG]),
    [siteSettings?.supportedLangs]
  );

  const value = useMemo<PageBuilderContextType>(
    () => ({
      currentPage,
      setCurrentPage,
      pages,
      refreshPages,
      isLoading,
      widgetDefinitions,
      siteSettings,
      supportedLangs,
      selectedWidgetId,
      selectWidget,
      ...widgetsApi,
      selectedSectionId,
      selectSection,
      ...sectionsApi,
      selectedColumnId,
      selectColumn,
      ...columnsApi,
      siteLayouts,
      currentLayout,
      setPageLayout,
      selectedSiteLayoutWidgetId,
      selectedSiteLayoutSection,
      selectSiteLayoutWidget,
      updateSiteLayoutWidgetConfig,
      updateSiteLayoutWidgetStyles,
      addSiteLayoutWidget,
      removeSiteLayoutWidget,
      replaceSiteLayoutWidget,
      duplicateSiteLayoutWidget,
      reorderSiteLayoutWidgets,
      ...dataBindingsApi,
      ...actionsApi,
      ...pageMetaApi,
      savePage,
      saveSiteLayout,
      publishCurrentPage,
      revertToPublishedVersion,
      isDirty,
      isLayoutDirty,
      isPreviewMode,
      setPreviewMode,
      viewport,
      setViewport,
      themes,
      activeTheme,
      setActiveTheme,
      pageVersion,
      versionDialogPage,
      setVersionDialogPage,
      editVersionDialogPage,
      setEditVersionDialogPage,
      canUndo,
      canRedo,
      undo,
      redo,
    }),
    [
      currentPage,
      setCurrentPage,
      pages,
      refreshPages,
      isLoading,
      widgetDefinitions,
      siteSettings,
      supportedLangs,
      selectedWidgetId,
      selectWidget,
      widgetsApi,
      selectedSectionId,
      selectSection,
      sectionsApi,
      selectedColumnId,
      selectColumn,
      columnsApi,
      siteLayouts,
      currentLayout,
      setPageLayout,
      selectedSiteLayoutWidgetId,
      selectedSiteLayoutSection,
      selectSiteLayoutWidget,
      updateSiteLayoutWidgetConfig,
      updateSiteLayoutWidgetStyles,
      addSiteLayoutWidget,
      removeSiteLayoutWidget,
      replaceSiteLayoutWidget,
      duplicateSiteLayoutWidget,
      reorderSiteLayoutWidgets,
      dataBindingsApi,
      actionsApi,
      pageMetaApi,
      savePage,
      saveSiteLayout,
      publishCurrentPage,
      revertToPublishedVersion,
      isDirty,
      isLayoutDirty,
      isPreviewMode,
      setPreviewMode,
      viewport,
      setViewport,
      themes,
      activeTheme,
      setActiveTheme,
      pageVersion,
      versionDialogPage,
      editVersionDialogPage,
      canUndo,
      canRedo,
      undo,
      redo,
    ]
  );

  return (
    <>
      <PageBuilderContext.Provider value={value}>{children}</PageBuilderContext.Provider>
      <SetPublishedVersionDialog
        open={versionDialogPage != null}
        onOpenChange={(open) => { if (!open) setVersionDialogPage(null); }}
        page={versionDialogPage}
        onSuccess={refreshPages}
      />
      <EditPageVersionDialog
        open={editVersionDialogPage != null}
        onOpenChange={(open) => { if (!open) setEditVersionDialogPage(null); }}
        page={editVersionDialogPage}
        onLoaded={(updatedPage) => {
          refreshPages();
          setCurrentPage(updatedPage);
          setEditVersionDialogPage(null);
        }}
      />
    </>
  );
}

export function usePageBuilder() {
  const context = useContext(PageBuilderContext);
  if (context === undefined) {
    throw new Error('usePageBuilder must be used within a PageBuilderProvider');
  }
  return context;
}
