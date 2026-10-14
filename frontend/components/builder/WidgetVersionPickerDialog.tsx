'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Info } from 'lucide-react';
import { getWidgetVersions, getWidgetVersion } from '@/services/api/widgetsApi';
import type { WidgetDefinition, WidgetVersionListItem } from '@/types/cms';

interface WidgetVersionPickerDialogProps {
  widget: WidgetDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (widget: WidgetDefinition, version: string, config: Record<string, unknown>) => void;
}

export const WidgetVersionPickerDialog: React.FC<WidgetVersionPickerDialogProps> = ({
  widget,
  open,
  onOpenChange,
  onSelect,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['widget-versions', widget?.slug],
    queryFn: () => getWidgetVersions(widget!.slug),
    enabled: open && !!widget,
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (versions && versions.length > 0) {
      const latest = versions.find((v) => v.isLatest);
      setSelectedVersion(latest?.version || versions[0].version);
    }
  }, [versions]);

  const handleConfirm = async () => {
    if (!widget || !selectedVersion) return;

    setIsLoading(true);
    try {
      if (selectedVersion === widget.version) {
        onSelect(widget, selectedVersion, widget.defaultConfig);
      } else {
        const versionDef = await getWidgetVersion(widget.slug, selectedVersion);
        if (versionDef) {
          onSelect(widget, selectedVersion, versionDef.defaultConfig);
        } else {
          onSelect(widget, selectedVersion, widget.defaultConfig);
        }
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseLatest = () => {
    if (!widget) return;
    onSelect(widget, widget.version, widget.defaultConfig);
    onOpenChange(false);
  };

  if (!widget) return null;

  const hasMultipleVersions = versions && versions.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {widget.name}</DialogTitle>
          <DialogDescription>
            {hasMultipleVersions
              ? 'Choose which version of this widget to add to your page.'
              : 'This widget will be added with the latest version.'}
          </DialogDescription>
        </DialogHeader>

        {versionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasMultipleVersions ? (
          <ScrollArea className="max-h-[300px]">
            <RadioGroup
              value={selectedVersion || ''}
              onValueChange={setSelectedVersion}
              className="space-y-3"
            >
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <RadioGroupItem
                    value={version.version}
                    id={version.id}
                    disabled={version.isDeprecated}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={version.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">v{version.version}</span>
                      {version.isLatest && (
                        <Badge variant="default" className="text-[10px]">
                          Latest
                        </Badge>
                      )}
                      {version.isDeprecated && (
                        <Badge variant="destructive" className="text-[10px]">
                          Deprecated
                        </Badge>
                      )}
                    </Label>
                    {version.changeLog && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        {version.changeLog}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <p>Version: v{widget.version}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {hasMultipleVersions ? (
            <Button onClick={handleConfirm} disabled={!selectedVersion || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Widget
            </Button>
          ) : (
            <Button onClick={handleUseLatest}>Add Widget</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetVersionPickerDialog;
