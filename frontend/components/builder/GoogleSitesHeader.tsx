'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Brand } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Undo2, 
  Redo2,
  Eye,
  Save,
  Link2,
  MoreVertical,
  LogOut,
  ChevronLeft,
  Share2,
  Settings,
  HelpCircle,
  Copy,
  Trash2,
  Database,
  History,
  FileText,
  Search as SearchIcon,
  ExternalLink,
  Globe
} from 'lucide-react';
import { copy } from '@/lib/copy';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SiteSettingsDialog } from './SiteSettingsDialog';
import { PublishDialog } from './PublishDialog';
import { PageDataPanel } from './PageDataPanel';
import { PageSeoPanel } from './PageSeoPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { toast } from 'sonner';

interface GoogleSitesHeaderProps {
  brand?: Brand;
}

export const GoogleSitesHeader: React.FC<GoogleSitesHeaderProps> = ({ brand }) => {
  const router = useRouter();
  const { user, logout, clearBrand } = useAuth();
  const { 
    currentPage, 
    savePage, 
    saveSiteLayout, 
    updatePageName,
    isDirty, 
    isLayoutDirty, 
    isPreviewMode, 
    setPreviewMode,
    canUndo,
    canRedo,
    undo,
    redo,
  } = usePageBuilder();

  const handleSave = async () => {
    if (isLayoutDirty) await saveSiteLayout();
    if (isDirty) await savePage();
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [pageNameDraft, setPageNameDraft] = useState('');
  const [isSavingPageName, setIsSavingPageName] = useState(false);

  useEffect(() => {
    setPageNameDraft(currentPage?.name || '');
  }, [currentPage?.id, currentPage?.name]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleBackToBrands = () => {
    clearBrand();
    router.push('/brands');
  };

  const handleCopyLink = () => {
    if (currentPage) {
      const url = `${window.location.origin}${currentPage.uri}`;
      navigator.clipboard.writeText(url);
      toast.success(copy.builder.header.toast.linkCopied);
    }
  };

  const previewBrandKey = brand?.subdomain || brand?.id;

  const handlePageNameSave = async () => {
    if (!currentPage || isSavingPageName) return;

    const trimmedName = pageNameDraft.trim();
    if (!trimmedName || trimmedName === currentPage.name) {
      setPageNameDraft(currentPage.name);
      return;
    }

    setIsSavingPageName(true);
    try {
      await updatePageName(trimmedName);
      await savePage();
      toast.success('Page title updated.');
    } catch (error) {
      console.error('Failed to update page title:', error);
      setPageNameDraft(currentPage.name);
      toast.error('Unable to update page title.');
    } finally {
      setIsSavingPageName(false);
    }
  };

  const handleViewPublished = () => {
    if (!currentPage || !currentPage.publishedRevisionId || !previewBrandKey) {
      toast.error(copy.builder.header.toast.pageNotPublished);
      return;
    }

    const previewUrl = `/preview/${previewBrandKey}${currentPage.uri}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center px-3 shrink-0">
        {/* Left section */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Back button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBackToBrands}
                className="shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to brands</TooltipContent>
          </Tooltip>

          {/* Site icon */}
          <div 
            className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: brand?.primaryColor || '#4285f4' }}
          >
            {brand?.name.substring(0, 1).toUpperCase() || 'S'}
          </div>

          {/* Site name - editable */}
          <div className="flex flex-col min-w-0">
            <Input
              value={pageNameDraft}
              onChange={(event) => setPageNameDraft(event.target.value)}
              onBlur={handlePageNameSave}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handlePageNameSave();
                  (event.currentTarget as HTMLInputElement).blur();
                }
              }}
              disabled={isSavingPageName || !currentPage}
              placeholder="Untitled site"
              className="border-0 bg-transparent h-auto py-0 px-1 text-lg font-normal focus-visible:ring-0 focus-visible:bg-accent rounded"
            />
            {brand && (
              <span className="text-xs text-muted-foreground px-1 truncate">
                {brand.domain}
              </span>
            )}
          </div>

          {(isDirty || isLayoutDirty) && (
            <Badge variant="secondary" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>

        {/* Center section - Undo/Redo */}
        <div className="flex items-center gap-1 mx-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!canUndo}
                onClick={undo}
              >
                <Undo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!canRedo}
                onClick={redo}
              >
                <Redo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Preview button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isPreviewMode ? "default" : "ghost"} 
                size="icon"
                onClick={() => setPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPreviewMode ? 'Exit preview' : 'Preview'}
            </TooltipContent>
          </Tooltip>

          {/* Save button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={!isDirty && !isLayoutDirty}
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save page and layout changes</TooltipContent>
          </Tooltip>

          {/* Copy link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                <Link2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>

          {/* Share button */}
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          {/* View Published button - only show if page is published */}
          {currentPage?.publishedRevisionId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleViewPublished}
                >
                  <Globe className="w-4 h-4" />
                  View Published
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View published page locally</TooltipContent>
            </Tooltip>
          )}

          {/* Publish button */}
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => setPublishOpen(true)}
          >
            Publish
            {currentPage?.status === 'published' && (
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-[10px]">
                Live
              </Badge>
            )}
          </Button>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Site settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeoOpen(true)}>
                <SearchIcon className="w-4 h-4 mr-2" />
                SEO settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDataOpen(true)}>
                <Database className="w-4 h-4 mr-2" />
                Page data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAuditOpen(true)}>
                <History className="w-4 h-4 mr-2" />
                Activity log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate site
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language switcher */}

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <div className="font-medium text-sm">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Dialogs */}
      <SiteSettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        brand={brand}
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
      />

      {/* Sheet panels */}
      <Sheet open={dataOpen} onOpenChange={setDataOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Page Data</SheetTitle>
            <SheetDescription>
              Manage variables and API calls for this page
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <PageDataPanel onClose={() => setDataOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={seoOpen} onOpenChange={setSeoOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-auto">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>SEO Settings</SheetTitle>
            <SheetDescription>
              Optimize this page for search engines
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <PageSeoPanel onClose={() => setSeoOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={auditOpen} onOpenChange={setAuditOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-auto">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Activity Log</SheetTitle>
            <SheetDescription>
              View recent changes to this page
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <AuditLogPanel onClose={() => setAuditOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};