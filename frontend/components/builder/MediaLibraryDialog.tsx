'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { copy } from '@/lib/copy';
import { MediaLibraryPanel } from '@/components/media/MediaLibraryPanel';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export const MediaLibraryDialog: React.FC<MediaLibraryDialogProps> = ({ open, onOpenChange, onSelect }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="shrink-0 space-y-1.5 border-b px-6 py-4">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle>{copy.builder.mediaLibrary.dialogTitle}</DialogTitle>
            <DialogDescription>
              Select a file from your library or upload (images, PDF, text, JSON, or Office). Some widgets expect
              images only.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
          <MediaLibraryPanel
            active={open}
            layout="compact"
            scrollHeightClass="flex-1 min-h-0"
            onConfirmSelection={(url) => {
              onSelect(url);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
