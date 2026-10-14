'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getWidgetCategories, getWidgetDefinitions } from '@/services/cmsApiService';
import type { WidgetCategory, WidgetCategoryDefinition, WidgetDefinition } from '@/types/cms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getIcon } from '@/lib/iconRegistry';
import { LayoutGrid, Globe, Search, Loader2, Sparkles, Zap } from 'lucide-react';
import type { InsertNavId } from './widgetLibraryTypes';
import { isBrandScopedWidget, isUniversalWidget } from './widgetLibraryUtils';
import { DraggableWidgetItem } from './DraggableWidgetItem';
import { InsertNavRow } from './InsertNavRow';

export const InsertTab: React.FC = () => {
  const params = useParams();
  const { selectedBrandId } = useAuth();
  /** Builder route is the source of truth for which brand catalog to load. */
  const effectiveBrandId = useMemo(() => {
    const route = typeof params.brandId === 'string' ? params.brandId.trim() : '';
    if (route) return route;
    return selectedBrandId?.trim() || undefined;
  }, [params.brandId, selectedBrandId]);
  const [widgetDefinitions, setWidgetDefinitions] = useState<WidgetDefinition[]>([]);
  const [widgetCategories, setWidgetCategories] = useState<WidgetCategoryDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNav, setSelectedNav] = useState<InsertNavId>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catalogAllBrands, setCatalogAllBrands] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInsertData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const brandFilter = catalogAllBrands ? undefined : effectiveBrandId || undefined;
        const [widgets, categories] = await Promise.all([
          getWidgetDefinitions(brandFilter),
          getWidgetCategories(),
        ]);

        if (!isMounted) return;
        setWidgetDefinitions(widgets);
        setWidgetCategories(categories);
      } catch (error) {
        console.error('Failed to load insert panel widgets:', error);
        if (!isMounted) return;
        setWidgetDefinitions([]);
        setWidgetCategories([]);
        setLoadError('Failed to load widgets.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInsertData();

    return () => {
      isMounted = false;
    };
  }, [effectiveBrandId, catalogAllBrands]);

  const sortedCategories = useMemo(
    () => [...widgetCategories].sort((first, second) => first.order - second.order),
    [widgetCategories]
  );

  const widgetsByCategory = useMemo(() => {
    return widgetDefinitions.reduce<Record<WidgetCategory, WidgetDefinition[]>>((acc, widget) => {
      const existingWidgets = acc[widget.category] ?? [];
      existingWidgets.push(widget);
      acc[widget.category] = existingWidgets;
      return acc;
    }, {} as Record<WidgetCategory, WidgetDefinition[]>);
  }, [widgetDefinitions]);

  const rankWidgets = useCallback(
    (widgets: WidgetDefinition[]) => {
      return [...widgets].sort((first, second) => {
        const firstIsBrandSpecific =
          !!effectiveBrandId && !!first.brandIds?.length && first.brandIds.includes(effectiveBrandId);
        const secondIsBrandSpecific =
          !!effectiveBrandId && !!second.brandIds?.length && second.brandIds.includes(effectiveBrandId);
        if (firstIsBrandSpecific !== secondIsBrandSpecific) {
          return firstIsBrandSpecific ? -1 : 1;
        }
        return first.name.localeCompare(second.name);
      });
    },
    [effectiveBrandId]
  );

  const searchFilteredWidgets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return widgetDefinitions.filter((widget) => {
      if (!normalizedQuery) return true;
      return (
        widget.name.toLowerCase().includes(normalizedQuery) ||
        widget.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, widgetDefinitions]);

  const navCounts = useMemo(() => {
    const list = searchFilteredWidgets;
    const byCategory = (id: WidgetCategory) => list.filter((w) => w.category === id).length;
    const categoryCounts = sortedCategories.reduce(
      (acc, cat) => {
        acc[cat.id] = byCategory(cat.id);
        return acc;
      },
      {} as Record<WidgetCategory, number>
    );
    return {
      all: list.length,
      brand: effectiveBrandId
        ? list.filter((w) => isBrandScopedWidget(effectiveBrandId, w)).length
        : 0,
      universal: list.filter(isUniversalWidget).length,
      advanced: list.filter((w) => w.isAdvanced).length,
      category: categoryCounts,
    };
  }, [searchFilteredWidgets, effectiveBrandId, sortedCategories]);

  const filteredWidgets = useMemo(() => {
    return rankWidgets(
      searchFilteredWidgets.filter((widget) => {
        if (selectedNav === 'all') return true;
        if (selectedNav === 'advanced') return widget.isAdvanced;
        if (selectedNav === 'brand') return isBrandScopedWidget(effectiveBrandId, widget);
        if (selectedNav === 'universal') return isUniversalWidget(widget);
        return widget.category === selectedNav;
      })
    );
  }, [searchFilteredWidgets, selectedNav, rankWidgets, effectiveBrandId]);

  const activeCategories = useMemo(() => {
    const hasCategorySections = sortedCategories.length > 0;
    return hasCategorySections
      ? sortedCategories
      : Object.keys(widgetsByCategory).map((category) => ({
          id: category as WidgetCategory,
          name: category,
          icon: 'layout-grid',
          description: '',
          order: Number.MAX_SAFE_INTEGER,
        }));
  }, [sortedCategories, widgetsByCategory]);

  const groupWidgetsByCategory = useCallback(
    (widgets: WidgetDefinition[]) => {
      return widgets.reduce<Record<WidgetCategory, WidgetDefinition[]>>((acc, widget) => {
        const bucket = acc[widget.category] ?? [];
        bucket.push(widget);
        acc[widget.category] = bucket;
        return acc;
      }, {} as Record<WidgetCategory, WidgetDefinition[]>);
    },
    []
  );

  const renderCategorySections = useCallback(
    (widgets: WidgetDefinition[]) => {
      const grouped = groupWidgetsByCategory(widgets);
      const categoriesWithWidgets = activeCategories.filter((c) => (grouped[c.id]?.length ?? 0) > 0);
      const showCategoryHeaders = categoriesWithWidgets.length > 1;

      if (!showCategoryHeaders) {
        return (
          <div className="space-y-1.5">
            {widgets.map((widget) => (
              <DraggableWidgetItem
                key={widget.id}
                widget={widget}
                isBrandSpecific={isBrandScopedWidget(effectiveBrandId, widget)}
              />
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-5">
          {categoriesWithWidgets.map((category) => {
            const categoryWidgets = grouped[category.id] ?? [];
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-2 border-b border-border pb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {categoryWidgets.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {categoryWidgets.map((widget) => (
                    <DraggableWidgetItem
                      key={widget.id}
                      widget={widget}
                      isBrandSpecific={isBrandScopedWidget(effectiveBrandId, widget)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    [activeCategories, groupWidgetsByCategory, effectiveBrandId]
  );

  const renderAllGroupedView = () => {
    const brandSlice = filteredWidgets.filter((w) => isBrandScopedWidget(effectiveBrandId, w));
    const universalSlice = filteredWidgets.filter((w) => isUniversalWidget(w));
    const otherSlice = filteredWidgets.filter(
      (w) => !isBrandScopedWidget(effectiveBrandId, w) && !isUniversalWidget(w)
    );

    const sections: { key: string; title: string; subtitle?: string; widgets: WidgetDefinition[] }[] = [];
    if (brandSlice.length) {
      sections.push({
        key: 'brand',
        title: 'Brand templates',
        subtitle: 'Made for this site',
        widgets: brandSlice,
      });
    }
    if (universalSlice.length) {
      sections.push({
        key: 'universal',
        title: 'All sites',
        subtitle: 'Reusable on any brand',
        widgets: universalSlice,
      });
    }
    if (otherSlice.length) {
      sections.push({
        key: 'other',
        title: 'Other',
        subtitle: 'Not assigned to this brand',
        widgets: otherSlice,
      });
    }

    if (!sections.length) {
      return (
        <p className="text-xs text-muted-foreground py-6 text-center">No widgets match your search.</p>
      );
    }

    return (
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={section.key}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="mb-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {section.widgets.length}
                </Badge>
              </div>
              {section.subtitle && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{section.subtitle}</p>
              )}
            </div>
            {renderCategorySections(section.widgets)}
          </div>
        ))}
      </div>
    );
  };

  const rightPanelTitle = useMemo(() => {
    if (selectedNav === 'all') return 'Widgets';
    if (selectedNav === 'advanced') return 'Advanced';
    if (selectedNav === 'brand') return 'Brand templates';
    if (selectedNav === 'universal') return 'All sites';
    const cat = activeCategories.find((c) => c.id === selectedNav);
    return cat?.name ?? 'Widgets';
  }, [selectedNav, activeCategories]);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-3 py-3 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search widgets..."
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="insert-catalog-all-brands" className="text-xs text-muted-foreground cursor-pointer leading-tight">
            All brands
            <span className="block font-normal text-[10px] text-muted-foreground/80">Show every scoped widget</span>
          </Label>
          <Switch
            id="insert-catalog-all-brands"
            checked={catalogAllBrands}
            onCheckedChange={setCatalogAllBrands}
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="w-[158px] shrink-0 border-r border-border">
          <div className="py-2 px-2 space-y-1">
            <InsertNavRow
              label="All"
              count={navCounts.all}
              isActive={selectedNav === 'all'}
              onClick={() => setSelectedNav('all')}
              icon={LayoutGrid}
            />
            {effectiveBrandId && navCounts.brand > 0 && (
              <InsertNavRow
                label="Brand"
                count={navCounts.brand}
                isActive={selectedNav === 'brand'}
                onClick={() => setSelectedNav('brand')}
                icon={Sparkles}
              />
            )}
            {navCounts.universal > 0 && (
              <InsertNavRow
                label="Library"
                count={navCounts.universal}
                isActive={selectedNav === 'universal'}
                onClick={() => setSelectedNav('universal')}
                icon={Globe}
              />
            )}
            <Separator className="my-2" />
            {activeCategories.map((category) => {
              const CategoryIcon = getIcon(category.icon);
              const count = navCounts.category[category.id] ?? 0;
              return (
                <InsertNavRow
                  key={category.id}
                  label={category.name}
                  count={count}
                  isActive={selectedNav === category.id}
                  onClick={() => setSelectedNav(category.id)}
                  icon={CategoryIcon}
                />
              );
            })}
            <Separator className="my-2" />
            <InsertNavRow
              label="Advanced"
              count={navCounts.advanced}
              isActive={selectedNav === 'advanced'}
              onClick={() => setSelectedNav('advanced')}
              icon={Zap}
            />
          </div>
        </ScrollArea>

        <ScrollArea className="flex-1 min-w-0">
          <div className="p-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {rightPanelTitle}
                </h3>
              </div>
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : selectedNav === 'all' ? (
                renderAllGroupedView()
              ) : !filteredWidgets.length ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No widgets match your filters for this brand.
                </p>
              ) : (
                renderCategorySections(filteredWidgets)
              )}
              {loadError && <p className="text-xs text-destructive mt-2">{loadError}</p>}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
