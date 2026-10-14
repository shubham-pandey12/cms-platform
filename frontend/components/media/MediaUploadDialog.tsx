'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaItem } from '@/services/cmsApiService';
import type { MediaUploadOutputFormat } from '@/services/api/mediaApi';
import type { MediaItem } from '@/types/cms';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { copy } from '@/lib/copy';
import { normalizeFolderPath } from '@/lib/mediaFolders';
import {
  MEDIA_LIBRARY_FILE_ACCEPT,
  canRasterWebpEncode,
  canUseCropTool,
} from '@/lib/mediaUploadPresentation';
import { MediaCropDialog } from '@/components/media/MediaCropDialog';
import { Crop, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export type MediaUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial folder path when dialog opens (e.g. current library folder) */
  defaultFolder: string;
  onUploaded: (media: MediaItem, folder: string) => void;
};

export function MediaUploadDialog({ open, onOpenChange, defaultFolder, onUploaded }: MediaUploadDialogProps) {
  const { selectedBrandId, user } = useAuth();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadOutputFormat, setUploadOutputFormat] = useState<MediaUploadOutputFormat>('original');
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropInputRef = useRef<HTMLInputElement>(null);
  const cropObjectUrlRef = useRef<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [dimensionsLoading, setDimensionsLoading] = useState(false);
  const [dimensionsError, setDimensionsError] = useState(false);

  const revokeCropUrl = useCallback(() => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }
    setCropSrc(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setUploadFolder(defaultFolder ? normalizeFolderPath(defaultFolder) : '');
    setUploadFile(null);
    setAltText('');
    setUploadOutputFormat('original');
    setUploadError(null);
    setFileInputKey((k) => k + 1);
    setCropOpen(false);
    revokeCropUrl();
  }, [open, defaultFolder, revokeCropUrl]);

  useEffect(() => () => revokeCropUrl(), [revokeCropUrl]);

  useEffect(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setImageDimensions(null);
    setDimensionsError(false);

    if (!uploadFile) {
      setDimensionsLoading(false);
      return;
    }

    const url = URL.createObjectURL(uploadFile);
    previewObjectUrlRef.current = url;
    setPreviewUrl(url);

    if (!uploadFile.type.startsWith('image/')) {
      setDimensionsLoading(false);
      return;
    }

    setDimensionsLoading(true);
    const img = new Image();
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setDimensionsLoading(false);
      setDimensionsError(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setImageDimensions(null);
      setDimensionsLoading(false);
      setDimensionsError(true);
    };
    img.src = url;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [uploadFile]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const clearUploadSelection = useCallback(() => {
    setUploadFile(null);
    setFileInputKey((k) => k + 1);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async (fileOverride?: File | null) => {
    const file = fileOverride ?? uploadFile;
    if (!file) {
      setUploadError('Choose a file to upload.');
      return;
    }

    const brandForUpload = selectedBrandId || user?.brandIds?.[0];
    if (!brandForUpload) {
      const message = 'Select a brand before uploading media.';
      setUploadError(message);
      toast.error(message);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const folder = normalizeFolderPath(uploadFolder || 'library');
      const media = await uploadMediaItem({
        file,
        brandId: brandForUpload,
        folder,
        alt: altText || undefined,
        outputFormat: canRasterWebpEncode(file) ? uploadOutputFormat : 'original',
      });

      if (media) {
        onUploaded({ ...media, folder }, folder);
        setUploadFile(null);
        setAltText('');
        setUploadFolder(folder);
        setFileInputKey((key) => key + 1);
        toast.success(copy.builder.mediaLibrary.toast.uploaded);
        onOpenChange(false);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
      setUploadError('Upload failed. Please try again.');
      toast.error(copy.builder.mediaLibrary.toast.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const onCropFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    revokeCropUrl();
    const url = URL.createObjectURL(f);
    cropObjectUrlRef.current = url;
    setCropSrc(url);
    setCropOpen(true);
  };

  const onCroppedBlob = async (blob: Blob) => {
    revokeCropUrl();
    const file = new File([blob], 'cropped.png', { type: 'image/png' });
    setUploadFile(file);
    await handleUpload(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload</DialogTitle>
          </DialogHeader>

          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">File</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    key={fileInputKey}
                    type="file"
                    accept={MEDIA_LIBRARY_FILE_ACCEPT}
                    className="flex-1 min-w-[200px]"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setUploadFile(f);
                      if (f && !canRasterWebpEncode(f)) {
                        setUploadOutputFormat('original');
                      }
                    }}
                    disabled={isUploading}
                  />
                  {uploadFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearUploadSelection}
                      disabled={isUploading}
                      aria-label="Clear selected file"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {uploadFile && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</div>
                  {previewUrl && uploadFile.type.startsWith('image/') && (
                    <div className="flex justify-center rounded-md bg-muted/80 p-2 max-h-64 overflow-hidden">
                      <NextImage
                        src={previewUrl}
                        alt={altText || uploadFile.name}
                        width={imageDimensions?.width ?? 1280}
                        height={imageDimensions?.height ?? 720}
                        unoptimized
                        className="max-h-64 w-auto max-w-full object-contain"
                      />
                    </div>
                  )}
                  {previewUrl && !uploadFile.type.startsWith('image/') && (
                    <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                  )}
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium truncate" title={uploadFile.name}>
                        {uploadFile.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Size</dt>
                      <dd className="font-medium">{formatFileSize(uploadFile.size)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium">{uploadFile.type || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Dimensions</dt>
                      <dd className="font-medium flex items-center gap-2 min-h-[1.25rem]">
                        {!uploadFile.type.startsWith('image/') && <span className="text-muted-foreground">—</span>}
                        {uploadFile.type.startsWith('image/') && dimensionsLoading && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                            <span className="text-muted-foreground">Reading…</span>
                          </>
                        )}
                        {uploadFile.type.startsWith('image/') && !dimensionsLoading && imageDimensions && (
                          <span>
                            {imageDimensions.width} × {imageDimensions.height} px
                          </span>
                        )}
                        {uploadFile.type.startsWith('image/') && !dimensionsLoading && !imageDimensions && dimensionsError && (
                          <span className="text-muted-foreground">Could not read dimensions</span>
                        )}
                        {uploadFile.type.startsWith('image/') && !dimensionsLoading && !imageDimensions && !dimensionsError && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {uploadFile && canUseCropTool(uploadFile) && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={cropInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onCropFileChosen}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => cropInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    Crop &amp; upload
                  </Button>
                  <span className="text-xs text-muted-foreground">{copy.builder.mediaLibrary.cropUploadHint}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Folder (optional)</Label>
                  <Input
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    placeholder="e.g., heroes"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alt text (optional)</Label>
                  <Input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Accessible description"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {uploadFile && canRasterWebpEncode(uploadFile) && (
                <div className="space-y-2 max-w-md">
                  <Label className="text-sm font-medium">Store as</Label>
                  <Select
                    value={uploadOutputFormat}
                    onValueChange={(v) => setUploadOutputFormat(v as MediaUploadOutputFormat)}
                    disabled={isUploading}
                  >
                    <SelectTrigger aria-label="Output image format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original format</SelectItem>
                      <SelectItem value="webp">WebP (smaller, wide support)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">SVG and animated GIF are always stored unchanged.</p>
                </div>
              )}

              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <span className="text-xs text-muted-foreground text-left">
              Supports: images (JPG, PNG, GIF, WebP, AVIF, SVG), PDF, TXT, Markdown, CSV, JSON, DOCX, XLSX, PPTX (max
              10MB).
            </span>
            <div className="flex items-center gap-2">
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleUpload()} disabled={isUploading || !uploadFile}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaCropDialog
        open={cropOpen}
        onOpenChange={(cropDialogOpen) => {
          setCropOpen(cropDialogOpen);
          if (!cropDialogOpen) revokeCropUrl();
        }}
        imageSrc={cropSrc}
        onCropped={onCroppedBlob}
      />
    </>
  );
}
