'use client';

import React, { useState, useEffect } from 'react';
import type { Page, PageRevisionDto } from '@/types/cms';
import { getPageRevisions, getPageRevisionContent, updatePage } from '@/services/cmsApiService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditPageVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: Page | null;
  onLoaded: (updatedPage: Page) => void;
}

function formatRevisionDate(createdAt: string): string {
  try {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return createdAt;
  }
}

export const EditPageVersionDialog: React.FC<EditPageVersionDialogProps> = ({
  open,
  onOpenChange,
  page,
  onLoaded,
}) => {
  const [revisions, setRevisions] = useState<PageRevisionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIntoEditor, setLoadingIntoEditor] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (open && page) {
      setLoading(true);
      setRevisions([]);
      setSelectedRevisionId(null);
      getPageRevisions(page.id)
        .then((list) => {
          setRevisions(list);
          if (list.length > 0) {
            setSelectedRevisionId(list[0].id);
          }
        })
        .catch(() => {
          toast.error('Failed to load version history');
          setRevisions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, page]);

  const handleLoadIntoEditor = async () => {
    if (!page || !selectedRevisionId) return;
    setLoadingIntoEditor(true);
    try {
      const revision = await getPageRevisionContent(page.id, selectedRevisionId);
      if (!revision) {
        toast.error('Failed to load revision content');
        return;
      }
      let bodyContent: unknown;
      try {
        bodyContent = JSON.parse(revision.bodyContent);
      } catch {
        bodyContent = [];
      }
      let layoutConfig: unknown;
      if (revision.layoutConfigJson) {
        try {
          layoutConfig = JSON.parse(revision.layoutConfigJson);
        } catch {
          layoutConfig = undefined;
        }
      } else {
        layoutConfig = undefined;
      }
      const updated = await updatePage(page.id, {
        bodyContent: bodyContent as Page['bodyContent'],
        seo: revision.seo,
        themeId: revision.themeId ?? undefined,
        layoutConfig: layoutConfig as Page['layoutConfig'],
        customCss: revision.customCss ?? undefined,
      });
      if (updated) {
        toast.success('Version loaded into editor', {
          description: 'You can edit and save.',
        });
        onLoaded(updated);
        onOpenChange(false);
      } else {
        toast.error('Failed to load version into editor');
      }
    } catch {
      toast.error('Failed to load version into editor');
    } finally {
      setLoadingIntoEditor(false);
    }
  };

  const isCurrentlyPublished = (revisionId: string) =>
    page?.publishedRevisionId != null && page.publishedRevisionId === revisionId;

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit older version</DialogTitle>
          <DialogDescription>
            Load a previous version of &quot;{page.name}&quot; into the editor. This replaces your
            current draft with the selected version so you can edit and save.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Pencil className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No version history yet.</p>
            <p className="mt-1">Publish the page at least once to see versions here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[280px] rounded-md border">
            <div className="p-2 space-y-1">
              {revisions.map((rev) => {
                const isPublished = isCurrentlyPublished(rev.id);
                const isSelected = selectedRevisionId === rev.id;
                return (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => setSelectedRevisionId(rev.id)}
                    className={`w-full text-left flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">
                      Revision from {formatRevisionDate(rev.createdAt)}
                    </span>
                    {isPublished && (
                      <span
                        className={`flex items-center gap-1 shrink-0 ${
                          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Live
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLoadIntoEditor}
            disabled={loading || revisions.length === 0 || !selectedRevisionId || loadingIntoEditor}
          >
            {loadingIntoEditor ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              'Load into editor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
