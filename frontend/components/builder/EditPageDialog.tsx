'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import type { Page, PageStatus } from '@/types/cms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validatePageUri } from '@/lib/pageUriValidation';

interface EditPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: Page | null;
}

const normalizeUri = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const EditPageDialog: React.FC<EditPageDialogProps> = ({ open, onOpenChange, page }) => {
  const { currentPage, setCurrentPage, updatePageName, updatePageUri, updatePageStatus, savePage, pages } = usePageBuilder();
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !page) return;
    setName(page.name);
    setUri(page.uri);
    setStatus(page.status);
    setError(null);
  }, [open, page]);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const normalizedUri = useMemo(() => normalizeUri(uri), [uri]);
  const hasChanges = useMemo(() => {
    if (!page) return false;
    return (
      trimmedName !== page.name ||
      normalizedUri !== page.uri ||
      status !== page.status
    );
  }, [page, trimmedName, normalizedUri, status]);

  const brandPages = useMemo(
    () => (pages ?? []).filter(p => !page || p.brandId === page.brandId),
    [pages, page]
  );

  const validate = (): string | null => {
    if (!page) return 'No page selected.';
    if (!trimmedName) return 'Page name is required.';
    const uriResult = validatePageUri(normalizedUri, brandPages, page.id);
    if (uriResult.error) return uriResult.error;
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!page) return;

    setIsSaving(true);
    setError(null);

    try {
      if (!currentPage || currentPage.id !== page.id) {
        await setCurrentPage(page);
      }

      if (trimmedName !== page.name) {
        await updatePageName(trimmedName);
      }
      if (normalizedUri !== page.uri) {
        await updatePageUri(normalizedUri);
      }
      if (status !== page.status) {
        await updatePageStatus(status);
      }

      await savePage();
      onOpenChange(false);
      toast.success('Page updated successfully.');
    } catch (saveError) {
      console.error('Failed to update page:', saveError);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit page</DialogTitle>
          <DialogDescription>Update page name, URI, and status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-page-name">Page Name</Label>
            <Input
              id="edit-page-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter page name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-page-uri">Page URI</Label>
            <Input
              id="edit-page-uri"
              value={uri}
              onChange={(event) => {
                setUri(event.target.value);
                if (error) setError(null);
              }}
              placeholder="/page-path"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-page-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: PageStatus) => {
                setStatus(value);
                if (error) setError(null);
              }}
            >
              <SelectTrigger id="edit-page-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
