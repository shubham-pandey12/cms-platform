'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { getPageData, getWidgetDefinitionById, getWidgetVersion } from '@/services/cmsApiService';
import type { PageData, WidgetDefinition, WidgetInstance } from '@/types/cms';
import { DataBindingEditor } from './DataBindingEditor';
import { ActionEditor } from './ActionEditor';
import { VisibilityRuleEditor } from './VisibilityRuleEditor';
import { fetchAllApiData } from '@/lib/dataBinding';
import { evaluateCondition } from '@/lib/widgetSchema/evaluateCondition';
import { useWidgetStylesClipboard } from '@/contexts/WidgetStylesClipboardContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MediaLibraryDialog } from './MediaLibraryDialog';
import { Clipboard, ClipboardPaste, FileText, Globe, History, Loader2, Pencil, Search } from 'lucide-react';
import {
  PropertiesContentTab,
  PropertiesFooter,
  PropertiesHeader,
  PropertiesStyleTab,
} from './properties';
import type { PaddingOption } from './properties';
import { migrateWidgetConfig } from '@/lib/widgetConfigMigration';
import { useAuth } from '@/contexts/AuthContext';
import { WidgetEmbedLinkSection } from '@/components/builder/WidgetEmbedLinkSection';

export const PropertiesPanel: React.FC = () => {
  const { selectedBrandId } = useAuth();
  const { clipboardEntry, copyStyles, hasCopied } = useWidgetStylesClipboard();
  const [fieldSearch, setFieldSearch] = useState('');
  const {
    currentPage,
    selectedWidgetId,
    selectedSiteLayoutWidgetId,
    selectedSiteLayoutSection,
    selectWidget,
    updateWidgetConfig,
    updateWidgetStyles,
    updateWidgetVersion,
    updateWidgetVisibilityRules,
    removeWidget,
    duplicateWidget,
    toggleWidgetVisibility,
    activeTheme,
    addDataBinding,
    removeDataBinding,
    updateDataBinding,
    addAction,
    removeAction,
    updateAction,
    currentLayout,
    selectSiteLayoutWidget,
    updateSiteLayoutWidgetConfig,
    updateSiteLayoutWidgetStyles,
    pageVersion,
    setVersionDialogPage,
    setEditVersionDialogPage,
    supportedLangs,
    widgetDefinitions,
  } = usePageBuilder();

  const [mediaOpen, setMediaOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(320); // Default 320px (w-80)
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [apiResponses, setApiResponses] = useState<Record<string, unknown>>({});
  const [isLoadingApiResponses, setIsLoadingApiResponses] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [fallbackWidgetDef, setFallbackWidgetDef] = useState<WidgetDefinition | null>(null);
  const [isLoadingFallbackDef, setIsLoadingFallbackDef] = useState(false);

  const MIN_WIDTH = 240;
  const MAX_WIDTH = 480;

  useEffect(() => {
    if (currentPage) {
      getPageData(currentPage.id).then(setPageData);
    } else {
      setPageData(null);
    }
  }, [currentPage]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidth = window.innerWidth - event.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  let widgetInstance: WidgetInstance | null = null;
  let isSiteLayoutWidget = false;
  let widgetSection: 'header' | 'footer' | null = null;

  if (currentLayout && selectedSiteLayoutWidgetId && selectedSiteLayoutSection) {
    const widgets = currentLayout[selectedSiteLayoutSection];
    widgetInstance = widgets.find((widget) => widget.id === selectedSiteLayoutWidgetId) || null;
    if (widgetInstance) {
      isSiteLayoutWidget = true;
      widgetSection = selectedSiteLayoutSection;
    }
  }

  if (!widgetInstance && currentPage && selectedWidgetId) {
    for (const section of currentPage.bodyContent || []) {
      for (const column of section.columns) {
        const widget = column.widgets.find((item) => item.id === selectedWidgetId);
        if (widget) {
          widgetInstance = widget;
          break;
        }
      }
      if (widgetInstance) break;
    }
  }

  const primaryWidgetDef = useMemo(() => {
    if (!widgetInstance) return null;
    return (
      widgetDefinitions.find(
        (definition) =>
          definition.id === widgetInstance.widgetDefinitionId ||
          definition.slug === widgetInstance.widgetDefinitionId
      ) ?? null
    );
  }, [widgetInstance, widgetDefinitions]);

  useEffect(() => {
    if (!widgetInstance) {
      setFallbackWidgetDef(null);
      setIsLoadingFallbackDef(false);
      return;
    }
    if (primaryWidgetDef) {
      setFallbackWidgetDef(null);
      setIsLoadingFallbackDef(false);
      return;
    }

    let cancelled = false;
    setIsLoadingFallbackDef(true);
    void getWidgetDefinitionById(widgetInstance.widgetDefinitionId).then((def) => {
      if (!cancelled) {
        setFallbackWidgetDef(def ?? null);
        setIsLoadingFallbackDef(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [widgetInstance, primaryWidgetDef, widgetInstance?.widgetDefinitionId]);

  const widgetDef = primaryWidgetDef ?? fallbackWidgetDef;

  const apiCalls = useMemo(() => pageData?.apiCalls || [], [pageData?.apiCalls]);
  const variables = useMemo(() => pageData?.variables || [], [pageData?.variables]);

  useEffect(() => {
    const loadApiResponses = async () => {
      if (apiCalls.length === 0) {
        setApiResponses({});
        return;
      }

      setIsLoadingApiResponses(true);
      try {
        const responses = await fetchAllApiData(apiCalls, variables);
        setApiResponses(responses);
      } catch (error) {
        console.error('Error fetching API responses for preview:', error);
        setApiResponses({});
      } finally {
        setIsLoadingApiResponses(false);
      }
    };

    loadApiResponses();
  }, [apiCalls, variables]);

  const handleVersionChange = useCallback(
    async (newVersion: string) => {
      if (!widgetInstance || !widgetDef || isSiteLayoutWidget) return;

      const newVersionDef = await getWidgetVersion(widgetDef.slug, newVersion);
      if (!newVersionDef) return;

      const migratedConfig = migrateWidgetConfig(
        widgetInstance.config,
        widgetDef.configSchema,
        newVersionDef.configSchema
      );

      updateWidgetVersion(
        widgetInstance.id,
        newVersion,
        migratedConfig,
        newVersionDef.defaultStyles
      );
    },
    [widgetInstance, widgetDef, isSiteLayoutWidget, updateWidgetVersion]
  );

  if (widgetInstance && isLoadingFallbackDef) {
    return (
      <div
        ref={panelRef}
        className="border-l border-border bg-card h-full flex flex-col items-center justify-center gap-2 relative"
        style={{ minWidth: MIN_WIDTH, width: panelWidth }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading widget definition…</p>
      </div>
    );
  }

  if (!widgetInstance || !widgetDef) {
    return (
      <div
        ref={panelRef}
        className="border-l border-border bg-card h-full flex flex-col relative"
        style={{ minWidth: MIN_WIDTH, width: panelWidth }}
      >
        {currentPage ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Page details</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {widgetInstance && !widgetDef
                  ? 'Widget definition could not be loaded.'
                  : 'Click a widget on the canvas to edit its properties.'}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                  <p className="text-sm font-medium mt-1">{currentPage.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URI</label>
                  <div className="flex items-center gap-1.5 mt-1 text-sm">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{currentPage.uri || '/'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <div className="mt-1">
                    <Badge variant={currentPage.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {currentPage.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Version</label>
                  <p className="text-sm mt-1">{pageVersion || currentPage.version || '1.0.0'}</p>
                </div>
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Version selection</label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setVersionDialogPage(currentPage)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Set published version…
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setEditVersionDialogPage(currentPage)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit older version…
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose which revision is live or load a past version into the editor.
                  </p>
                </div>
              </div>
            </ScrollArea>
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
            >
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary transition-colors" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Select a page or a widget to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const config = { ...widgetDef.defaultConfig, ...widgetInstance.config };
  const styles = { ...widgetDef.defaultStyles, ...widgetInstance.styles };

  const handleConfigChange = (fieldName: string, value: unknown) => {
    if (isSiteLayoutWidget && widgetSection) {
      updateSiteLayoutWidgetConfig(widgetInstance.id, widgetSection, { [fieldName]: value });
    } else {
      updateWidgetConfig(widgetInstance.id, { [fieldName]: value });
    }
  };

  const handleStyleChange = (styleName: string, value: unknown) => {
    if (isSiteLayoutWidget && widgetSection) {
      updateSiteLayoutWidgetStyles(widgetInstance.id, widgetSection, { [styleName]: value });
    } else {
      updateWidgetStyles(widgetInstance.id, { [styleName]: value });
    }
  };

  const handleMediaSelect = (url: string) => {
    if (activeMediaField) {
      handleConfigChange(activeMediaField, url);
      setActiveMediaField(null);
    }
    setMediaOpen(false);
  };

  const openMediaLibrary = (fieldName: string) => {
    setActiveMediaField(fieldName);
    setMediaOpen(true);
  };

  const paddingOptions: PaddingOption[] = [
    { value: 'none', label: 'None', px: '0' },
    { value: 'sm', label: 'Small', px: '16px' },
    { value: 'md', label: 'Medium', px: '32px' },
    { value: 'lg', label: 'Large', px: '48px' },
    { value: 'xl', label: 'Extra Large', px: '64px' },
  ];

  return (
    <>
      <div
        ref={panelRef}
        className="bg-card border-l border-border flex flex-col h-full relative"
        style={{ width: panelWidth, minWidth: MIN_WIDTH }}
      >
        <PropertiesHeader
          isSiteLayoutWidget={isSiteLayoutWidget}
          widgetSection={widgetSection}
          widgetSlug={widgetDef.slug}
          widgetName={widgetDef.name}
          widgetVersion={widgetInstance.widgetVersion || widgetDef.version}
          onBack={() => {
            if (isSiteLayoutWidget) {
              selectSiteLayoutWidget(null, 'header');
            } else {
              selectWidget(null);
            }
          }}
          onDuplicate={() => duplicateWidget(widgetInstance.id)}
          onVersionChange={!isSiteLayoutWidget ? handleVersionChange : undefined}
        />

        {currentPage && (
          <WidgetEmbedLinkSection
            isSiteLayoutWidget={isSiteLayoutWidget}
            widgetSlug={widgetDef.slug}
            supportsHtmlEmbed={widgetDef.supportsHtmlEmbed}
            currentPage={currentPage}
            widgetInstanceId={widgetInstance.id}
            selectedBrandId={selectedBrandId}
            supportedLangs={supportedLangs}
          />
        )}

        {(() => {
          // Build effective tab list — use schema.tabs if declared, otherwise default 5 tabs
          const defaultTabs = [
            { key: 'content', label: 'Content' },
            { key: 'style', label: 'Style' },
            { key: 'bindings', label: 'Bindings' },
            { key: 'actions', label: 'Actions' },
            { key: 'visibility', label: 'Visibility' },
          ];
          const schemaTabs = widgetDef.configSchema.tabs;
          const effectiveTabs = schemaTabs
            ? schemaTabs.filter((t) => !t.when || evaluateCondition(t.when, config))
            : defaultTabs;
          const cols = effectiveTabs.length;
          return (
        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
          <TabsList
            className="mx-4 mt-4 grid"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {effectiveTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Field search bar — shown above Content tab list */}
          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Search fields…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <PropertiesContentTab
            widgetDef={widgetDef}
            config={config}
            onConfigChange={handleConfigChange}
            onOpenMediaLibrary={openMediaLibrary}
            supportedLangs={supportedLangs}
            dynamicVariables={currentPage?.dynamicVariables ?? []}
            fieldSearch={fieldSearch}
            defaultConfig={widgetDef.defaultConfig}
            apiCalls={apiCalls}
          />

          {/* Copy / Paste styles toolbar */}
          <TabsContent value="style" className="px-4 pt-3 pb-0 mt-0">
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => copyStyles(styles as import('@/types/cms').WidgetStyles, config.elementStyles as Record<string, Record<string, string>> | undefined)}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy styles
              </Button>
              {hasCopied && clipboardEntry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => {
                    if (!clipboardEntry) return;
                    Object.entries(clipboardEntry.styles).forEach(([k, v]) => handleStyleChange(k, v));
                    if (clipboardEntry.elementStyles) {
                      handleConfigChange('elementStyles', clipboardEntry.elementStyles);
                    }
                  }}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste styles
                </Button>
              )}
            </div>
          </TabsContent>

          <PropertiesStyleTab
            config={config}
            styles={styles}
            activeTheme={activeTheme}
            styleableElements={widgetDef.configSchema.styleableElements}
            onConfigChange={handleConfigChange}
            onStyleChange={handleStyleChange}
            paddingOptions={paddingOptions}
          />

          <TabsContent value="bindings" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4">
                <DataBindingEditor
                  bindings={widgetInstance.dataBindings || []}
                  apiCalls={apiCalls}
                  variables={variables}
                  apiResponses={apiResponses}
                  isLoadingApiResponses={isLoadingApiResponses}
                  availableProps={widgetDef.configSchema.fields.map((field) => field.name)}
                  onAdd={(binding) => addDataBinding(widgetInstance.id, binding)}
                  onRemove={(bindingId) => removeDataBinding(widgetInstance.id, bindingId)}
                  onUpdate={(bindingId, updates) => updateDataBinding(widgetInstance.id, bindingId, updates)}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4">
                <ActionEditor
                  actions={widgetInstance.actions || {}}
                  apiCalls={apiCalls}
                  availableActionNames={['onClick', 'onHover', 'onFocus']}
                  onAdd={(actionName, action) => addAction(widgetInstance.id, actionName, action)}
                  onRemove={(actionName) => removeAction(widgetInstance.id, actionName)}
                  onUpdate={(actionName, updates) => updateAction(widgetInstance.id, actionName, updates)}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="visibility" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4">
                <VisibilityRuleEditor
                  rules={widgetInstance.visibilityRules || []}
                  onAdd={(rule) => {
                    const currentRules = widgetInstance.visibilityRules || [];
                    updateWidgetVisibilityRules(widgetInstance.id, [...currentRules, rule]);
                  }}
                  onRemove={(index) => {
                    const currentRules = widgetInstance.visibilityRules || [];
                    updateWidgetVisibilityRules(widgetInstance.id, currentRules.filter((_, itemIndex) => itemIndex !== index));
                  }}
                  onUpdate={(index, rule) => {
                    const currentRules = widgetInstance.visibilityRules || [];
                    const updatedRules = [...currentRules];
                    updatedRules[index] = rule;
                    updateWidgetVisibilityRules(widgetInstance.id, updatedRules);
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
          );
        })()}

        <PropertiesFooter
          isVisible={widgetInstance.isVisible}
          onToggleVisibility={() => toggleWidgetVisibility(widgetInstance.id)}
          onDelete={() => {
            removeWidget(widgetInstance.id);
          }}
        />

        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
        >
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary transition-colors" />
        </div>
      </div>

      <MediaLibraryDialog open={mediaOpen} onOpenChange={setMediaOpen} onSelect={handleMediaSelect} />
    </>
  );
};
