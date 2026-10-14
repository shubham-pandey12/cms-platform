'use client';

import React, { useState } from 'react';
import { SiteLayout, WidgetInstance } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Layout } from 'lucide-react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { DynamicWidgetRenderer } from './DynamicWidgetRenderer';

interface LayoutManagerProps {
  layouts: SiteLayout[];
  currentLayoutId?: string;
  onSelectLayout?: (layoutId: string) => void;
  onCreateLayout?: (layout: Omit<SiteLayout, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
  onUpdateLayout?: (layoutId: string, updates: Partial<SiteLayout>) => void;
  onDeleteLayout?: (layoutId: string) => void;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  layouts,
  currentLayoutId,
  onSelectLayout,
  onCreateLayout,
  onUpdateLayout,
  onDeleteLayout,
}) => {
  const { activeTheme, addWidget, widgetDefinitions } = usePageBuilder();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<SiteLayout | null>(null);
  const [layoutName, setLayoutName] = useState<string>('');
  const [headerWidgets, setHeaderWidgets] = useState<WidgetInstance[]>([]);
  const [footerWidgets, setFooterWidgets] = useState<WidgetInstance[]>([]);

  const handleCreate = () => {
    setEditingLayout(null);
    setLayoutName('');
    setHeaderWidgets([]);
    setFooterWidgets([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (layout: SiteLayout) => {
    setEditingLayout(layout);
    setLayoutName(layout.name);
    setHeaderWidgets([...layout.header]);
    setFooterWidgets([...layout.footer]);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!layoutName.trim()) return;

    const layoutData = {
      brandId: editingLayout?.brandId || '',
      name: layoutName,
      header: headerWidgets,
      footer: footerWidgets,
      sidebar: editingLayout?.sidebar,
    };

    if (editingLayout) {
      onUpdateLayout?.(editingLayout.id, layoutData);
    } else {
      onCreateLayout?.(layoutData);
    }

    setIsDialogOpen(false);
  };

  const handleAddWidget = (section: 'header' | 'footer', widgetDefinitionId: string) => {
    const widgetDef = widgetDefinitions.find(
      w => w.id === widgetDefinitionId || w.slug === widgetDefinitionId
    );
    const newWidget: WidgetInstance = {
      id: `widget-${Date.now()}`,
      widgetDefinitionId,
      widgetVersion: widgetDef?.version || '1.0.0',
      config: widgetDef?.defaultConfig || {},
      styles: widgetDef?.defaultStyles || {},
      order: section === 'header' ? headerWidgets.length : footerWidgets.length,
      isVisible: true,
    };

    if (section === 'header') {
      setHeaderWidgets([...headerWidgets, newWidget]);
    } else {
      setFooterWidgets([...footerWidgets, newWidget]);
    }
  };

  const handleRemoveWidget = (section: 'header' | 'footer', widgetId: string) => {
    if (section === 'header') {
      setHeaderWidgets(headerWidgets.filter(w => w.id !== widgetId));
    } else {
      setFooterWidgets(footerWidgets.filter(w => w.id !== widgetId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Site Layouts</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Create Layout
        </Button>
      </div>

      <div className="space-y-2">
        {layouts.map((layout) => (
          <div
            key={layout.id}
            className={`
              flex items-center justify-between p-3 border rounded-lg cursor-pointer
              transition-colors hover:bg-accent/50
              ${currentLayoutId === layout.id ? 'border-primary bg-primary/5' : ''}
            `}
            onClick={() => onSelectLayout?.(layout.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{layout.name}</span>
                {currentLayoutId === layout.id && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>Header: {layout.header.length} widgets</span>
                <span>Footer: {layout.footer.length} widgets</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(layout);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayout?.(layout.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLayout ? 'Edit Layout' : 'Create Layout'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Layout Name</Label>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="e.g., Main Marketing Layout"
              />
            </div>

            <Tabs defaultValue="header" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="header">
                  Header ({headerWidgets.length})
                </TabsTrigger>
                <TabsTrigger value="footer">
                  Footer ({footerWidgets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="space-y-4">
                <div className="border rounded-lg p-4 min-h-[200px]">
                  {headerWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">No header widgets</p>
                      <p className="text-xs mt-1">Add widgets from the widget library</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {headerWidgets.map((widget) => {
                        const widgetDef = widgetDefinitions.find(
                          w => w.id === widget.widgetDefinitionId || w.slug === widget.widgetDefinitionId
                        );
                        return (
                          <div
                            key={widget.id}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <div className="flex-1">
                              {widgetDef && (
                                <DynamicWidgetRenderer
                                  widgetInstance={widget}
                                  widgetDefinition={widgetDef}
                                  theme={activeTheme}
                                />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleRemoveWidget('header', widget.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="footer" className="space-y-4">
                <div className="border rounded-lg p-4 min-h-[200px]">
                  {footerWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">No footer widgets</p>
                      <p className="text-xs mt-1">Add widgets from the widget library</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {footerWidgets.map((widget) => {
                        const widgetDef = widgetDefinitions.find(
                          w => w.id === widget.widgetDefinitionId || w.slug === widget.widgetDefinitionId
                        );
                        return (
                          <div
                            key={widget.id}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <div className="flex-1">
                              {widgetDef && (
                                <DynamicWidgetRenderer
                                  widgetInstance={widget}
                                  widgetDefinition={widgetDef}
                                  theme={activeTheme}
                                />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleRemoveWidget('footer', widget.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!layoutName.trim()}>
              {editingLayout ? 'Update' : 'Create'} Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
