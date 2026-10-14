'use client';

import React, { useState, useEffect } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { useAuth } from '@/contexts/AuthContext';
import { getBrandById, getPageRevisions } from '@/services/cmsApiService';
import type { Brand, PageRevisionDto } from '@/types/cms';
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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { bumpVersion, parseVersion, formatVersion, type VersionBump } from '@/lib/semver';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Variable,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationItem {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'error';
  message?: string;
}

function clampVersionPart(n: number): number {
  return Math.max(0, Math.floor(Number(n)) || 0);
}

export const PublishDialog: React.FC<PublishDialogProps> = ({ open, onOpenChange }) => {
  const { currentPage, publishCurrentPage } = usePageBuilder();
  const { selectedBrandId } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [dynamicPreviewValues, setDynamicPreviewValues] = useState<Record<string, string>>({});
  const [brand, setBrand] = useState<Brand | undefined>(undefined);
  const previewBrandKey = brand?.subdomain || selectedBrandId;
  const [publishFrom, setPublishFrom] = useState<'current' | 'revision'>('current');
  const [revisions, setRevisions] = useState<PageRevisionDto[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  const currentParsed = parseVersion(currentPage?.version ?? '1.0.0');
  const [major, setMajor] = useState(currentParsed.major);
  const [minor, setMinor] = useState(currentParsed.minor);
  const [patch, setPatch] = useState(currentParsed.patch);

  useEffect(() => {
    if (selectedBrandId) {
      getBrandById(selectedBrandId).then(setBrand);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    if (open && currentPage) {
      const { major: m, minor: mi, patch: p } = bumpVersion(currentPage.version || '1.0.0', 'patch');
      setMajor(m);
      setMinor(mi);
      setPatch(p);
      setPublishFrom('current');
      setSelectedRevisionId(null);
      setRevisionsLoading(true);
      getPageRevisions(currentPage.id)
        .then((list) => {
          setRevisions(list);
          if (list.length > 0 && currentPage.publishedRevisionId && list.some((r) => r.id === currentPage.publishedRevisionId)) {
            setSelectedRevisionId(currentPage.publishedRevisionId);
          } else if (list.length > 0) {
            setSelectedRevisionId(list[0].id);
          }
        })
        .finally(() => setRevisionsLoading(false));
    }
  }, [open, currentPage]);

  const suggestBump = (bump: VersionBump) => {
    if (!currentPage) return;
    const next = bumpVersion(currentPage.version || '1.0.0', bump);
    setMajor(next.major);
    setMinor(next.minor);
    setPatch(next.patch);
  };

  const versionToPublish = formatVersion(major, minor, patch);

  if (!currentPage) return null;

  const isDynamic = currentPage.isDynamic;
  const isPublished = currentPage.status === 'published';

  // Validation checks
  const validations: ValidationItem[] = [
    {
      id: 'seo-title',
      label: 'SEO Title',
      status: currentPage.seo.title && currentPage.seo.title.length >= 30 ? 'pass' : 'warning',
      message: currentPage.seo.title ? 
        (currentPage.seo.title.length < 30 ? 'Title is short (30-60 chars recommended)' : undefined) : 
        'Missing SEO title',
    },
    {
      id: 'seo-description',
      label: 'Meta Description',
      status: currentPage.seo.description && currentPage.seo.description.length >= 120 ? 'pass' : 'warning',
      message: currentPage.seo.description ? 
        (currentPage.seo.description.length < 120 ? 'Description is short (120-160 chars recommended)' : undefined) : 
        'Missing meta description',
    },
    {
      id: 'widgets',
      label: 'Page Content',
      status: (() => {
        // Count widgets in new structure
        const widgetCount = (currentPage.bodyContent || []).reduce(
          (count, section) => count + section.columns.reduce(
            (colCount, column) => colCount + column.widgets.length, 0
          ), 0
        );
        return widgetCount > 0 ? 'pass' : 'error';
      })(),
      message: (() => {
        const widgetCount = (currentPage.bodyContent || []).reduce(
          (count, section) => count + section.columns.reduce(
            (colCount, column) => colCount + column.widgets.length, 0
          ), 0
        );
        return widgetCount === 0 ? 'Page has no widgets' : undefined;
      })(),
    },
    {
      id: 'og-image',
      label: 'Open Graph Image',
      status: currentPage.seo.ogImage ? 'pass' : 'warning',
      message: !currentPage.seo.ogImage ? 'No OG image set (recommended for social sharing)' : undefined,
    },
  ];

  const hasErrors = validations.some(v => v.status === 'error');
  const hasWarnings = validations.some(v => v.status === 'warning');

  const handlePublish = async () => {
    if (publishFrom === 'current' && hasErrors) {
      toast.error(copy.builder.publish.cannotPublish, {
        description: copy.builder.publish.fixErrorsBeforePublish,
      });
      return;
    }
    if (publishFrom === 'revision' && !selectedRevisionId) {
      toast.error('Please select a previous version to publish.');
      return;
    }

    setIsPublishing(true);
    try {
      await publishCurrentPage(
        versionToPublish,
        publishFrom === 'revision' ? selectedRevisionId : undefined
      );
      onOpenChange(false);
      toast.success(copy.builder.publish.pagePublished, {
        description: formatCopy(copy.builder.publish.pagePublishedDescription, {
          name: currentPage.name,
          domain: brand?.domain ?? '',
          uri: currentPage.uri,
        }),
        action: {
          label: copy.builder.publish.viewLocally,
          onClick: () => window.open(`/preview/${previewBrandKey}${currentPage.uri}`, '_blank'),
        },
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getPreviewUrl = () => {
    let url = currentPage.uri;
    if (isDynamic) {
      currentPage.dynamicVariables.forEach(v => {
        const value = dynamicPreviewValues[v];
        if (value) url = url.replace(`<${v}>`, value);
      });
    }
    return `https://${brand?.domain}${url}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.builder.publish.dialogTitle}</DialogTitle>
          <DialogDescription>
            Review and publish &quot;{currentPage.name}&quot; to {brand?.domain}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Page Info */}
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brand?.primaryColor }}
            >
              {brand?.name.substring(0, 1)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{currentPage.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {brand?.domain}{currentPage.uri}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={isPublished ? 'default' : 'secondary'}>
                  {isPublished ? copy.builder.publish.published : copy.builder.publish.draft}
                </Badge>
                {isDynamic && (
                  <Badge variant="outline">
                    <Variable className="w-3 h-3 mr-1" />
                    Dynamic URL
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Current version: {currentPage.version || '1.0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Version to publish */}
          <div className="space-y-3">
            <Label>Version to publish to</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Suggest:</span>
              <Button type="button" variant="outline" size="sm" onClick={() => suggestBump('major')}>
                Major
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => suggestBump('minor')}>
                Minor
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => suggestBump('patch')}>
                Patch
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center border rounded-md">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={major}
                  onChange={(e) => setMajor(clampVersionPart(Number(e.target.value)))}
                  className="w-14 h-9 text-center border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l">
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setMajor((m) => m + 1)}
                    aria-label="Increment major"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setMajor((m) => Math.max(0, m - 1))}
                    aria-label="Decrement major"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className="text-muted-foreground font-medium">.</span>
              <div className="flex items-center border rounded-md">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={minor}
                  onChange={(e) => setMinor(clampVersionPart(Number(e.target.value)))}
                  className="w-14 h-9 text-center border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l">
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setMinor((m) => m + 1)}
                    aria-label="Increment minor"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setMinor((m) => Math.max(0, m - 1))}
                    aria-label="Decrement minor"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className="text-muted-foreground font-medium">.</span>
              <div className="flex items-center border rounded-md">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={patch}
                  onChange={(e) => setPatch(clampVersionPart(Number(e.target.value)))}
                  className="w-14 h-9 text-center border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l">
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setPatch((p) => p + 1)}
                    aria-label="Increment patch"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-0.5 hover:bg-muted"
                    onClick={() => setPatch((p) => Math.max(0, p - 1))}
                    aria-label="Decrement patch"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium">
              Publishing to version <strong>{versionToPublish}</strong>
            </p>
          </div>

          {/* What to publish: current draft vs previous version */}
          <div className="space-y-3">
            <Label>Publish from</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishFrom"
                  checked={publishFrom === 'current'}
                  onChange={() => setPublishFrom('current')}
                  className="rounded-full border-input"
                />
                <span className="text-sm">Current draft</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishFrom"
                  checked={publishFrom === 'revision'}
                  onChange={() => setPublishFrom('revision')}
                  className="rounded-full border-input"
                />
                <span className="text-sm">Previous version</span>
              </label>
            </div>
            {publishFrom === 'revision' && (
              <div className="pl-6 space-y-2">
                {revisionsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading versions…
                  </div>
                ) : revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No previous versions. Publish once to create version history.
                  </p>
                ) : (
                  <select
                    value={selectedRevisionId ?? ''}
                    onChange={(e) => setSelectedRevisionId(e.target.value || null)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {revisions.map((rev) => (
                      <option key={rev.id} value={rev.id}>
                        Revision from {new Date(rev.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {currentPage.publishedRevisionId === rev.id ? ' (currently live)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  Pre-publish checks above apply to the current draft. The selected version will go live as-is.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic URL Preview Input */}
          {isDynamic && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="text-sm font-medium">Dynamic URL Preview</div>
              <p className="text-xs text-muted-foreground">
                Enter values to preview how the URL will look with real data
              </p>
              {currentPage.dynamicVariables.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 font-mono">&lt;{v}&gt;</span>
                  <Input
                    value={dynamicPreviewValues[v] ?? ''}
                    onChange={(e) =>
                      setDynamicPreviewValues((prev) => ({ ...prev, [v]: e.target.value }))
                    }
                    placeholder={`Enter ${v}`}
                    className="flex-1 h-7 text-xs"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Preview:</span>
                <code className="bg-background px-2 py-1 rounded">{getPreviewUrl()}</code>
              </div>
            </div>
          )}

          <Separator />

          {/* Validation Checks */}
          <div>
            <div className="text-sm font-medium mb-3">Pre-publish Checks</div>
            <div className="space-y-2">
              {validations.map((validation) => (
                <div 
                  key={validation.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  {validation.status === 'pass' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {validation.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  {validation.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">{validation.label}</div>
                    {validation.message && (
                      <div className={cn(
                        "text-xs",
                        validation.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
                      )}>
                        {validation.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          {hasWarnings && !hasErrors && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                There are some warnings. You can still publish, but consider fixing them for better SEO.
              </div>
            </div>
          )}

          {/* Error Message */}
          {hasErrors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                Please fix all errors before publishing this page.
              </div>
            </div>
          )}

          {/* Last Published Info */}
          {currentPage.publishedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Last published: {new Date(currentPage.publishedAt).toLocaleString()}
              {currentPage.version && (
                <span> (Version {currentPage.version})</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            {copy.common.cancel}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              isPublishing ||
              (publishFrom === 'current' && hasErrors) ||
              (publishFrom === 'revision' && (!selectedRevisionId || revisions.length === 0))
            }
            className="sm:flex-1"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                {isPublished ? copy.builder.publish.updatePublishedButton : copy.builder.publish.publishButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
