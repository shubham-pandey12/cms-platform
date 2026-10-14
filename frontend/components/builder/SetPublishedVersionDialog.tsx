'use client';

import React, { useState, useEffect } from 'react';
import type { Page, PageRevisionDto } from '@/types/cms';
import { getPageRevisions, publishPage } from '@/services/cmsApiService';
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
import { CheckCircle2, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';

interface SetPublishedVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: Page | null;
  onSuccess: () => void;
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

export const SetPublishedVersionDialog: React.FC<SetPublishedVersionDialogProps> = ({
  open,
  onOpenChange,
  page,
  onSuccess,
}) => {
  const [revisions, setRevisions] = useState<PageRevisionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (open && page) {
      setLoading(true);
      setRevisions([]);
      setSelectedRevisionId(null);
      getPageRevisions(page.id)
        .then((list) => {
          setRevisions(list);
          if (page.publishedRevisionId && list.some((r) => r.id === page.publishedRevisionId)) {
            setSelectedRevisionId(page.publishedRevisionId);
          } else if (list.length > 0) {
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

  const handleSetAsPublished = async () => {
    if (!page || !selectedRevisionId) return;
    const version = page.version || '1.0.0';
    setPublishing(true);
    try {
      const updated = await publishPage(page.id, version, selectedRevisionId);
      if (updated) {
        toast.success('Published version updated', {
          description: `The live site will now show the selected version.`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to set published version');
      }
    } catch {
      toast.error('Failed to set published version');
    } finally {
      setPublishing(false);
    }
  };

  const isCurrentlyPublished = (revisionId: string) =>
    page?.publishedRevisionId != null && page.publishedRevisionId === revisionId;

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set published version</DialogTitle>
          <DialogDescription>
            Choose which version of &quot;{page.name}&quot; is shown on the live site. Only existing
            revisions are listed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
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
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
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
            onClick={handleSetAsPublished}
            disabled={
              loading ||
              revisions.length === 0 ||
              !selectedRevisionId ||
              publishing ||
              selectedRevisionId === page.publishedRevisionId
            }
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating…
              </>
            ) : (
              'Set as published'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
