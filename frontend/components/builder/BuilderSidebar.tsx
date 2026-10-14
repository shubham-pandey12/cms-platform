'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Page, Brand, Template } from '@/types/cms';
import { getPages, getTemplates, createPage, deletePage as deletePageFromService } from '@/services/cmsApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  Plus, 
  FileText, 
  Search, 
  LayoutTemplate,
  Settings,
  FolderOpen,
  Globe,
  Trash2,
  MoreHorizontal,
  Copy,
  History,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { copy, formatCopy } from '@/lib/copy';
import { CreatePageDialog } from './CreatePageDialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BuilderSidebarProps {
  brand?: Brand;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ brand }) => {
  const router = useRouter();
  const { clearBrand } = useAuth();
  const { currentPage, setCurrentPage, pages, refreshPages, setVersionDialogPage, setEditVersionDialogPage } = usePageBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pages' | 'templates'>('pages');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const load = async () => {
      const list = brand ? await getTemplates(brand.id) : await getTemplates();
      setTemplates(list);
    };
    load();
  }, [brand]);

  // Get pages for current brand from context (already from mock data)
  const brandPages = brand 
    ? pages.filter(p => p.brandId === brand.id)
    : pages;

  const filteredPages = brandPages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.uri.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToBrands = () => {
    clearBrand();
    router.push('/brands');
  };

  const handleDeletePage = (page: Page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePage = () => {
    if (pageToDelete) {
      deletePageFromService(pageToDelete.id);
      refreshPages();
      if (currentPage?.id === pageToDelete.id) {
        setCurrentPage(null);
      }
      toast.success(formatCopy(copy.builder.sidebar.toast.pageDeleted, { name: pageToDelete.name }));
    }
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  const handleDuplicatePage = async (page: Page) => {
    const bodyContentArray = (page.bodyContent || []).map(section => ({
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columns: section.columns.map(column => ({
        ...column,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        widgets: column.widgets.map(w => ({
          ...w,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }))
    }));
    const newPage = await createPage({
      brandId: page.brandId,
      name: `${page.name} (Copy)`,
      uri: `${page.uri}-copy`,
      isDynamic: page.isDynamic,
      layoutId: page.layoutId || 'layout-default',
      bodyContent: JSON.stringify(bodyContentArray),
    });
    if (newPage) {
      refreshPages();
      setCurrentPage(newPage);
      toast.success(formatCopy(copy.builder.sidebar.toast.pageDuplicated, { name: newPage.name }));
    }
  };

  const handleCreateFromTemplate = async (template: Template) => {
    if (!brand) return;
    
    const bodyContentArray = (template.bodyContent || []).map(section => ({
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columns: section.columns.map(column => ({
        ...column,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        widgets: column.widgets.map(w => ({
          ...w,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }))
    }));
    const newPage = await createPage({
      brandId: brand.id,
      name: `New ${template.name}`,
      uri: `/new-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
      isDynamic: false,
      layoutId: 'layout-default',
      bodyContent: JSON.stringify(bodyContentArray),
    });
    if (newPage) {
      refreshPages();
      setCurrentPage(newPage);
      toast.success(formatCopy(copy.builder.sidebar.toast.pageCreatedFromTemplate, { name: template.name }));
      setActiveTab('pages');
    }
  };

  const getStatusBadge = (status: Page['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="published">Published</Badge>;
      case 'draft':
        return <Badge variant="draft">Draft</Badge>;
      case 'disabled':
        return <Badge variant="disabled">Disabled</Badge>;
    }
  };

  return (
    <>
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={handleBackToBrands}
            className="flex items-center gap-2 text-sidebar-muted hover:text-sidebar-foreground transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">All Brands</span>
          </button>
          
          {brand && (
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sidebar-foreground">{brand.name}</div>
                <div className="text-xs text-sidebar-muted">{brand.domain}</div>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-muted" />
            <Input
              placeholder={activeTab === 'pages' ? "Search pages..." : "Search templates..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3 gap-1">
          <button
            onClick={() => setActiveTab('pages')}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'pages' 
                ? "bg-sidebar-accent text-sidebar-foreground" 
                : "text-sidebar-muted hover:text-sidebar-foreground"
            )}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Pages ({brandPages.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'templates' 
                ? "bg-sidebar-accent text-sidebar-foreground" 
                : "text-sidebar-muted hover:text-sidebar-foreground"
            )}
          >
            <LayoutTemplate className="w-4 h-4 inline mr-2" />
            Templates ({templates.length})
          </button>
        </div>

        {/* Page/Template List */}
        <ScrollArea className="flex-1 px-3 py-2">
          {activeTab === 'pages' && (
            <div className="space-y-1">
              {filteredPages.length === 0 ? (
                <div className="py-8 text-center">
                  <FolderOpen className="w-10 h-10 mx-auto text-sidebar-muted mb-3" />
                  <p className="text-sm text-sidebar-muted">No pages found</p>
                </div>
              ) : (
                filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className={cn(
                      "flex items-start gap-1 rounded-lg transition-colors",
                      currentPage?.id === page.id
                        ? "bg-sidebar-primary"
                        : "hover:bg-sidebar-accent"
                    )}
                  >
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "flex-1 min-w-0 text-left p-3 rounded-lg",
                        currentPage?.id === page.id
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{page.name}</span>
                        {getStatusBadge(page.status)}
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{page.uri}</span>
                      </div>
                    </button>
                    {/* Page actions menu - always visible in layout (version, duplicate, delete) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-1.5 h-7 w-7 shrink-0 rounded-md text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          aria-label="Page actions (version, duplicate, delete)"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setVersionDialogPage(page); }}>
                          <History className="w-4 h-4 mr-2" />
                          Set published version…
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditVersionDialogPage(page); }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit older version…
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicatePage(page)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePage(page)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-1">
              {filteredTemplates.length === 0 ? (
                <div className="py-8 text-center">
                  <LayoutTemplate className="w-10 h-10 mx-auto text-sidebar-muted mb-3" />
                  <p className="text-sm text-sidebar-muted">No templates found</p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateFromTemplate(template)}
                    className="w-full text-left p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {template.thumbnail ? (
                        <Image
                          src={template.thumbnail}
                          alt={template.name}
                          width={48}
                          height={32}
                          className="w-12 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-sidebar-accent flex items-center justify-center">
                          <LayoutTemplate className="w-4 h-4 text-sidebar-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{template.name}</div>
                        <div className="text-xs text-sidebar-muted truncate">
                          {(() => {
                            const widgetCount = (template.bodyContent || []).reduce(
                              (count, section) => count + section.columns.reduce(
                                (colCount, column) => colCount + column.widgets.length, 0
                              ), 0
                            );
                            return `${widgetCount} widgets`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="sidebar"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
          <Button className="w-full justify-start" variant="sidebar">
            <Settings className="w-4 h-4 mr-2" />
            Brand Settings
          </Button>
        </div>
      </div>

      {/* Create Page Dialog */}
      <CreatePageDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        brandId={brand?.id || 'brand-1'}
        onPageCreated={(page) => {
          refreshPages();
          setCurrentPage(page);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.builder.sidebar.deletePageTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pageToDelete ? formatCopy(copy.builder.sidebar.deletePageDescription, { name: pageToDelete.name }) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePage} className="bg-destructive text-destructive-foreground">
              {copy.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
