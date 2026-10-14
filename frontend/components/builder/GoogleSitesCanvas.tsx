'use client';

import React, { useState, useEffect } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  LayoutGrid,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionRenderer } from './SectionRenderer';
import { SiteLayoutWrapper } from '@/components/viewer/SiteLayoutWrapper';
import { SortableSiteLayoutWidget } from './SortableSiteLayoutWidget';
import { getBrandById, getSiteSettings } from '@/services/cmsApiService';
import { useAuth } from '@/contexts/AuthContext';
import { Brand, SiteSettings } from '@/types/cms';

// Note: Widget rendering is handled by SectionRenderer -> ColumnRenderer -> SortableWidget
// This ensures consistent widget ordering and interaction across the application

export const GoogleSitesCanvas: React.FC = () => {
  const { currentPage, addWidget, isPreviewMode, viewport, setViewport, activeTheme, currentLayout, widgetDefinitions, addSiteLayoutWidget } = usePageBuilder();
  const { selectedBrandId } = useAuth();
  const [headerChooserOpen, setHeaderChooserOpen] = useState(false);
  const [footerChooserOpen, setFooterChooserOpen] = useState(false);
  
  // State for async-loaded data needed in preview mode
  const [brand, setBrand] = useState<Brand | undefined>(undefined);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | undefined>(undefined);
  
  // Load brand and site settings asynchronously
  useEffect(() => {
    if (!selectedBrandId) {
      setBrand(undefined);
      setSiteSettings(undefined);
      return;
    }
    
    const loadData = async () => {
      const [brandData, settingsData] = await Promise.all([
        getBrandById(selectedBrandId),
        getSiteSettings(selectedBrandId),
      ]);
      setBrand(brandData);
      setSiteSettings(settingsData);
    };
    
    loadData();
  }, [selectedBrandId]);
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const viewportWidth = {
    desktop: 'max-w-5xl',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm',
  };

  const navigationWidgets = widgetDefinitions.filter((widget) => widget.category === 'navigation');
  const siteLayoutWidgetOptions = navigationWidgets.length > 0 ? navigationWidgets : widgetDefinitions;

  const renderEmptySiteLayoutState = (
    section: 'header' | 'footer',
    chooserOpen: boolean,
    setChooserOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => (
    <div className="flex flex-col items-center justify-center gap-3 text-center py-3">
      <p className="text-sm text-muted-foreground">
        Drop widgets here to add to site {section}
      </p>
      <Popover open={chooserOpen} onOpenChange={setChooserOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Choose widget
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="p-2 border-b text-sm font-medium text-foreground">Choose widget</div>
          <ScrollArea className="h-56">
            <div className="p-2 space-y-1">
              {siteLayoutWidgetOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No widgets available</p>
              ) : (
                siteLayoutWidgetOptions.map((widgetDef) => (
                  <button
                    key={widgetDef.id}
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                    onClick={() => {
                      addSiteLayoutWidget(section, widgetDef.id);
                      setChooserOpen(false);
                    }}
                  >
                    <span className="font-medium">{widgetDef.name}</span>
                    {widgetDef.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{widgetDef.description}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="text-center animate-fade-in">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${activeTheme.colors.primary}15` }}
          >
            <LayoutGrid className="w-10 h-10" style={{ color: activeTheme.colors.primary }} />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">No page selected</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a page from the Pages tab to start editing
          </p>
        </div>
      </div>
    );
  }

  const bodyContent = currentPage.bodyContent || [];

  // Preview Mode
  if (isPreviewMode) {
    return (
      <div className="flex-1 overflow-auto" style={{ backgroundColor: `${activeTheme.colors.secondary}10` }}>
        {/* Viewport selector */}
        <div 
          className="sticky top-0 z-20 backdrop-blur py-2 px-4 flex items-center justify-center gap-1"
          style={{ backgroundColor: `${activeTheme.colors.secondary}ee` }}
        >
          <Button
            variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewport('desktop')}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewport('tablet')}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <Tablet className="w-4 h-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewport('mobile')}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile
          </Button>
        </div>
        
        {/* Preview content */}
        <div className="p-8">
          <div className={cn(
            "mx-auto shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
            viewportWidth[viewport]
          )}
          style={{ backgroundColor: activeTheme.colors.background }}
          >
            {currentPage && selectedBrandId && brand && (
              <>
                {/* Site Layout Header */}
                {currentLayout && (
                  <SiteLayoutWrapper
                    brand={brand}
                    page={currentPage}
                    siteSettings={siteSettings}
                    siteLayout={currentLayout}
                    brandId={selectedBrandId}
                    theme={activeTheme}
                    renderHeader={true}
                    renderFooter={false}
                    widgetDefinitions={widgetDefinitions}
                  />
                )}
                
                {/* Page Body Content */}
                {bodyContent.length === 0 ? (
                  <div className="flex items-center justify-center h-96" style={{ color: activeTheme.colors.text }}>
                    No content on this page
                  </div>
                ) : (
                  <div className="space-y-0">
                    {bodyContent.map((section) => (
                      <SectionRenderer
                        key={section.id}
                        section={section}
                        isPreview={true}
                      />
                    ))}
                  </div>
                )}
                
                {/* Site Layout Footer */}
                {currentLayout && (
                  <SiteLayoutWrapper
                    brand={brand}
                    page={currentPage}
                    siteSettings={siteSettings}
                    siteLayout={currentLayout}
                    brandId={selectedBrandId}
                    theme={activeTheme}
                    renderHeader={false}
                    renderFooter={true}
                    widgetDefinitions={widgetDefinitions}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="flex-1 bg-canvas overflow-auto">
      {/* Canvas header with viewport controls */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentPage.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {currentPage.uri}
          </Badge>
          <Badge 
            variant={currentPage.status === 'published' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {currentPage.status}
          </Badge>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewport('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desktop</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewport('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tablet</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewport('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mobile</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Canvas content */}
      <div className="p-8">
        <div className={cn(
          "mx-auto rounded-lg shadow-lg overflow-hidden transition-all duration-300",
          viewportWidth[viewport]
        )}
        style={{ backgroundColor: activeTheme.colors.background }}
        >
          {/* Site Layout Header */}
          {currentLayout && (
            <div className="border-b-2 border-dashed border-primary/30 bg-muted/20">
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-medium">
                  Site Header
                </Badge>
                <span className="text-xs text-muted-foreground">Appears on all pages</span>
              </div>
              <div 
                id="site-layout-header-drop"
                className={cn(
                  "p-4 space-y-2 min-h-[60px] transition-colors",
                  currentLayout.header.length === 0 && "border-2 border-dashed border-muted rounded-lg flex items-center justify-center"
                )}
              >
                {currentLayout.header.length === 0 ? (
                  renderEmptySiteLayoutState('header', headerChooserOpen, setHeaderChooserOpen)
                ) : (
                  currentLayout.header
                    .filter(w => w.isVisible !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((widget) => (
                      <SortableSiteLayoutWidget
                        key={widget.id}
                        widgetInstance={widget}
                        section="header"
                        isPreview={false}
                      />
                    ))
                )}
              </div>
            </div>
          )}

          {/* Page Content Drop Zone */}
          <div
            ref={setNodeRef}
            className={cn(
              "min-h-[60vh] transition-colors",
              isOver && "bg-dropzone"
            )}
          >
            {bodyContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <Plus className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Start building your page</p>
                <p className="text-sm">Drag widgets from the Insert tab or click to add</p>
              </div>
            ) : (
              <div className="space-y-0">
                {bodyContent.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    isPreview={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Site Layout Footer */}
          {currentLayout && (
            <div className="border-t-2 border-dashed border-primary/30 bg-muted/20">
              <div className="px-4 py-2 bg-primary/5 border-t border-primary/20 flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-medium">
                  Site Footer
                </Badge>
                <span className="text-xs text-muted-foreground">Appears on all pages</span>
              </div>
              <div 
                id="site-layout-footer-drop"
                className={cn(
                  "p-4 space-y-2 min-h-[60px] transition-colors",
                  currentLayout.footer.length === 0 && "border-2 border-dashed border-muted rounded-lg flex items-center justify-center"
                )}
              >
                {currentLayout.footer.length === 0 ? (
                  renderEmptySiteLayoutState('footer', footerChooserOpen, setFooterChooserOpen)
                ) : (
                  currentLayout.footer
                    .filter(w => w.isVisible !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((widget) => (
                      <SortableSiteLayoutWidget
                        key={widget.id}
                        widgetInstance={widget}
                        section="footer"
                        isPreview={false}
                      />
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
