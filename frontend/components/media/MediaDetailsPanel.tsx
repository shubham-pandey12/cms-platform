'use client';

import React, { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import type { MediaItem } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, ExternalLink, ImageIcon } from 'lucide-react';
import { getMediaLibraryPlaceholderIcon } from '@/lib/mediaUploadPresentation';

export type MediaDetailsPanelProps = {
  item: MediaItem | null;
  formatFileSize: (bytes: number) => string;
  onCopyUrl: () => void | Promise<void>;
  onUpdate: (id: string, payload: { name?: string; alt?: string; folder?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
};

function formatUploadedAt(uploadedAt: Date | string | undefined): string {
  if (!uploadedAt) return '—';
  const d = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function MediaDetailsPanel({
  item,
  formatFileSize,
  onCopyUrl,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: MediaDetailsPanelProps) {
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editFolder, setEditFolder] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!item) {
      setEditName('');
      setEditAlt('');
      setEditFolder('');
      setConfirmDelete(false);
      return;
    }

    setEditName(item.name);
    setEditAlt(item.alt ?? '');
    setEditFolder(item.folder ?? '');
    setConfirmDelete(false);
  }, [item]);

  const hasChanges = useMemo(() => {
    if (!item) return false;

    const normalizedName = editName.trim();
    const normalizedAlt = editAlt.trim();
    const normalizedFolder = editFolder.trim();
    return (
      normalizedName !== item.name ||
      normalizedAlt !== (item.alt ?? '') ||
      normalizedFolder !== (item.folder ?? '')
    );
  }, [editName, editAlt, editFolder, item]);

  const handleSaveChanges = async () => {
    if (!item) return;
    if (!hasChanges || isUpdating || isDeleting) return;
    await onUpdate(item.id, {
      name: editName.trim(),
      alt: editAlt.trim() || undefined,
      folder: editFolder.trim() || undefined,
    });
  };

  const handleDelete = async () => {
    if (!item) return;
    if (isDeleting || isUpdating) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(item.id);
    setConfirmDelete(false);
  };

  if (!item) {
    return (
      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
        <ImageIcon className="h-10 w-10 opacity-50" aria-hidden />
        <p>Select a file to see details</p>
      </div>
    );
  }

  const showImagePreview = item.type === 'image';
  const PreviewIcon = getMediaLibraryPlaceholderIcon(item.type, item.name);

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          {showImagePreview ? (
            <div className="relative aspect-square w-full bg-muted">
              <NextImage
                src={item.thumbnail || item.url}
                alt={item.alt || item.name}
                fill
                className="object-contain"
                sizes="320px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted p-6 text-muted-foreground">
              <PreviewIcon className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" aria-hidden />
              <p className="text-center text-xs">Preview not available for this file type</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-md border bg-background/80 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="media-edit-name" className="text-xs uppercase tracking-wide text-muted-foreground">
              Name
            </Label>
            <Input
              id="media-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-edit-alt" className="text-xs uppercase tracking-wide text-muted-foreground">
              Alt text
            </Label>
            <Input
              id="media-edit-alt"
              value={editAlt}
              onChange={(e) => setEditAlt(e.target.value)}
              placeholder="Optional accessibility description"
              disabled={isUpdating || isDeleting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-edit-folder" className="text-xs uppercase tracking-wide text-muted-foreground">
              Folder
            </Label>
            <Input
              id="media-edit-folder"
              value={editFolder}
              onChange={(e) => setEditFolder(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={() => void handleSaveChanges()}
            disabled={!hasChanges || isUpdating || isDeleting}
          >
            {isUpdating ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Size</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatFileSize(item.size)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</dt>
            <dd className="mt-0.5 font-medium capitalize">{item.type}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uploaded</dt>
            <dd className="mt-0.5 text-xs text-foreground/90">{formatUploadedAt(item.uploadedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Storage</dt>
            <dd className="mt-0.5 font-mono text-xs">{item.storageProvider}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="button" variant="default" size="sm" className="w-full justify-center" onClick={() => void onCopyUrl()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full justify-center" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in new tab
            </a>
          </Button>
          <Button
            type="button"
            variant={confirmDelete ? 'destructive' : 'outline'}
            size="sm"
            className="w-full justify-center"
            onClick={() => void handleDelete()}
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? 'Deleting...' : confirmDelete ? 'Click again to confirm delete' : 'Delete file'}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
