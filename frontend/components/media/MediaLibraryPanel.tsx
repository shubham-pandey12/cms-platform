'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMediaLibrary } from '@/services/cmsApiService';
import { MediaItem } from '@/types/cms';
import { deleteMediaItem, updateMediaItem } from '@/services/api/mediaApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search,
  Upload,
  Image as ImageIcon,
  Folder,
  Check,
  Grid3X3,
  List,
  Loader2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { MediaDetailsPanel } from './MediaDetailsPanel';
import { MediaUploadDialog } from '@/components/media/MediaUploadDialog';
import {
  buildMediaFolderTree,
  computeFolderCounts,
  isInFolderOrDescendant,
  normalizeFolderPath,
  type MediaFolderNode,
} from '@/lib/mediaFolders';
import { getMediaLibraryPlaceholderIcon } from '@/lib/mediaUploadPresentation';

export type MediaLibraryPanelProps = {
  /** When true, loads and refreshes media list */
  active: boolean;
  /** Picker mode: confirm returns selected asset URL */
  onConfirmSelection?: (url: string) => void;
  onCancel?: () => void;
  /** Full-page Drive layout vs compact (e.g. builder picker dialog) */
  layout?: 'page' | 'compact';
  /** Scroll area min height for results in compact layout */
  scrollHeightClass?: string;
};

export function MediaLibraryPanel({
  active,
  onConfirmSelection,
  onCancel,
  layout = 'page',
  scrollHeightClass = 'flex-1 min-h-0',
}: MediaLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUpdatingSelected, setIsUpdatingSelected] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const pickerMode = Boolean(onConfirmSelection);
  const showDetailsPanel = layout === 'page';

  useEffect(() => {
    if (!active) return;
    const loadMedia = async () => {
      setIsLoading(true);
      try {
        const media = await getMediaLibrary();
        setMediaItems(media);
      } catch (error) {
        console.error('Failed to load media:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMedia();
  }, [active]);

  const accessibleMedia = mediaItems;

  const normalizedMedia = useMemo(() => {
    return accessibleMedia.map((m) => ({ ...m, folder: normalizeFolderPath(m.folder) }));
  }, [accessibleMedia]);

  const selectedFolderPath = selectedFolder ? normalizeFolderPath(selectedFolder) : null;

  const folderTree = useMemo(() => {
    const folderPaths = normalizedMedia.map((m) => m.folder);
    const base = buildMediaFolderTree(folderPaths);
    const folderByItemId = new Map<string, string>();
    for (const m of normalizedMedia) folderByItemId.set(m.id, m.folder);
    return computeFolderCounts(base, folderByItemId);
  }, [normalizedMedia]);

  const toggleFolderExpanded = useCallback((path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const filteredMedia = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedMedia.filter((m) => {
      const matchesSearch = !q || m.name.toLowerCase().includes(q);
      const matchesFolder = !selectedFolderPath || isInFolderOrDescendant(m.folder, selectedFolderPath);
      return matchesSearch && matchesFolder;
    });
  }, [normalizedMedia, searchQuery, selectedFolderPath]);

  const selectedItem = normalizedMedia.find((m) => m.id === selectedMedia) ?? null;

  const breadcrumbSegments = useMemo(() => {
    if (!selectedFolderPath) return [];
    const parts = selectedFolderPath.split('/').filter(Boolean);
    const segments: { name: string; path: string }[] = [];
    for (let i = 0; i < parts.length; i++) {
      segments.push({ name: parts[i], path: parts.slice(0, i + 1).join('/') });
    }
    return segments;
  }, [selectedFolderPath]);

  const renderFolderNode = (node: MediaFolderNode, depth: number) => {
    const isExpanded = expandedFolders[node.path] ?? depth < 1;
    const isSelected = selectedFolderPath === node.path;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.path}>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setSelectedFolder(node.path)}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
              isSelected ? 'bg-accent' : 'hover:bg-accent/50'
            )}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
            title={node.path}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">{node.name}</span>
            <span className="ml-auto shrink-0 tabular-nums text-xs text-muted-foreground">{node.itemCountTotal}</span>
          </button>
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleFolderExpanded(node.path)}
              className="ml-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? '▾' : '▸'}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-1">{node.children.map((child) => renderFolderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const handleConfirm = () => {
    if (selectedMedia && onConfirmSelection) {
      const media = accessibleMedia.find((m) => m.id === selectedMedia);
      if (media) {
        onConfirmSelection(media.url);
        setSelectedMedia(null);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const copySelectedUrl = async () => {
    if (!selectedItem?.url) return;
    try {
      await navigator.clipboard.writeText(selectedItem.url);
      toast.success('URL copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const defaultUploadFolder = selectedFolderPath ?? '';

  const handleUploaded = (media: MediaItem, folder: string) => {
    setMediaItems((prev) => [{ ...media, folder }, ...prev]);
    setSelectedMedia(media.id);
    setSelectedFolder(folder);
  };

  const handleUpdateMedia = async (id: string, payload: { name?: string; alt?: string; folder?: string }) => {
    setIsUpdatingSelected(true);
    try {
      const updated = await updateMediaItem(id, payload);
      if (!updated) {
        toast.error('Could not save changes');
        return;
      }

      setMediaItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setSelectedMedia(updated.id);
      toast.success('Media updated');
    } catch (error) {
      console.error('Failed to update media:', error);
      toast.error('Could not save changes');
    } finally {
      setIsUpdatingSelected(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    setIsDeletingSelected(true);
    try {
      const ok = await deleteMediaItem(id);
      if (!ok) {
        toast.error('Could not delete file');
        return;
      }
      setMediaItems((prev) => prev.filter((m) => m.id !== id));
      if (selectedMedia === id) {
        setSelectedMedia(null);
      }
      toast.success('Media deleted');
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast.error('Could not delete file');
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const resultsScrollClass =
    layout === 'page' ? cn('flex-1 min-h-0', showDetailsPanel && 'xl:h-full') : scrollHeightClass;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className="shrink-0 rounded px-1 py-0.5 font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            All Media
          </button>
          {breadcrumbSegments.map((seg) => (
            <React.Fragment key={seg.path}>
              <span className="opacity-50" aria-hidden>
                /
              </span>
              <button
                type="button"
                onClick={() => setSelectedFolder(seg.path)}
                className={cn(
                  'max-w-[140px] truncate rounded px-1 py-0.5 hover:bg-accent hover:text-foreground sm:max-w-[220px]',
                  selectedFolderPath === seg.path ? 'font-medium text-foreground' : undefined
                )}
                title={seg.path}
              >
                {seg.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this folder…"
              className="pl-9"
              aria-label="Search media"
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" className="gap-1.5" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1',
          showDetailsPanel ? 'flex-col xl:flex-row xl:divide-x xl:divide-border' : 'flex-col md:flex-row md:divide-x md:divide-border'
        )}
      >
        <aside
          className={cn(
            'flex shrink-0 flex-col border-b bg-muted/10',
            showDetailsPanel
              ? 'w-full max-h-[32vh] xl:h-full xl:max-h-none xl:w-[260px] xl:border-b-0'
              : 'w-full max-h-[28vh] md:h-auto md:max-h-none md:w-[220px] md:border-b-0 md:border-r'
          )}
        >
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </div>
          <ScrollArea className={cn('min-h-0 flex-1 px-2 py-2', showDetailsPanel ? 'xl:min-h-0' : 'md:min-h-0')}>
            <div className="space-y-1 pr-2">
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                  !selectedFolder ? 'bg-accent' : 'hover:bg-accent/50'
                )}
              >
                <ImageIcon className="h-4 w-4" aria-hidden />
                All Media
              </button>
              {folderTree.map((node) => renderFolderNode(node, 0))}
            </div>
          </ScrollArea>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!showDetailsPanel && pickerMode && selectedItem && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copySelectedUrl()}>
                <Copy className="mr-1 h-4 w-4" />
                Copy URL
              </Button>
            </div>
          )}

          <ScrollArea className={cn(resultsScrollClass, 'min-h-0')}>
            <div className="p-3 pr-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {filteredMedia.map((media) => {
                    const PlaceholderIcon = getMediaLibraryPlaceholderIcon(media.type, media.name);
                    return (
                    <button
                      type="button"
                      key={media.id}
                      onClick={() => setSelectedMedia(media.id)}
                      className={cn(
                        'group relative overflow-hidden rounded-lg border-2 transition-all',
                        selectedMedia === media.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-border'
                      )}
                    >
                      {media.type === 'image' ? (
                        <div
                          className="aspect-square bg-muted bg-cover bg-center"
                          style={{ backgroundImage: `url(${media.thumbnail})` }}
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
                          <PlaceholderIcon className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/35" />
                      {selectedMedia === media.id && (
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="truncate text-xs text-white">{media.name}</div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMedia.map((media) => {
                    const ListIcon = getMediaLibraryPlaceholderIcon(media.type, media.name);
                    return (
                    <button
                      type="button"
                      key={media.id}
                      onClick={() => setSelectedMedia(media.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg p-2 transition-colors',
                        selectedMedia === media.id ? 'bg-primary/10' : 'hover:bg-accent'
                      )}
                    >
                      {media.type === 'image' ? (
                        <div
                          className="h-12 w-12 shrink-0 rounded bg-muted bg-cover bg-center"
                          style={{ backgroundImage: `url(${media.thumbnail})` }}
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                          <ListIcon className="h-6 w-6" aria-hidden />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">{media.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(media.size)} · {media.folder}
                        </div>
                      </div>
                      {selectedMedia === media.id && <Check className="h-5 w-5 shrink-0 text-primary" />}
                    </button>
                    );
                  })}
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="mb-3 h-12 w-12 animate-spin text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Loading media…</div>
                </div>
              ) : (
                filteredMedia.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground" aria-hidden />
                    <div className="text-sm font-medium text-foreground">No files here</div>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Try another folder or upload an image. {searchQuery.trim() ? 'Clear search to see more.' : ''}
                    </p>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>

        {showDetailsPanel && (
          <aside className="flex max-h-[40vh] w-full shrink-0 flex-col border-t bg-muted/15 xl:h-full xl:max-h-none xl:w-[min(100%,320px)] xl:border-l xl:border-t-0">
            <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </div>
            <div className="min-h-0 flex-1">
              <MediaDetailsPanel
                item={selectedItem}
                formatFileSize={formatFileSize}
                onCopyUrl={copySelectedUrl}
                onUpdate={handleUpdateMedia}
                onDelete={handleDeleteMedia}
                isUpdating={isUpdatingSelected}
                isDeleting={isDeletingSelected}
              />
            </div>
          </aside>
        )}
      </div>

      {pickerMode && (
        <div className="flex shrink-0 justify-end gap-2 border-t px-3 py-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedMedia}>
            Select Image
          </Button>
        </div>
      )}

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        defaultFolder={defaultUploadFolder}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
