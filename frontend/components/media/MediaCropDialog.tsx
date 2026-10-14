'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCroppedImg } from '@/lib/cropImage';
import { copy } from '@/lib/copy';
import { Loader2 } from 'lucide-react';

export type AspectPresetId =
  | 'free'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '21:9'
  | '9:16'
  | '2:3'
  | 'custom';

type MediaCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropped: (blob: Blob) => void | Promise<void>;
};

function aspectFromPreset(preset: AspectPresetId): number | undefined {
  switch (preset) {
    case 'free':
      return undefined;
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '3:2':
      return 3 / 2;
    case '16:9':
      return 16 / 9;
    case '21:9':
      return 21 / 9;
    case '9:16':
      return 9 / 16;
    case '2:3':
      return 2 / 3;
    case 'custom':
      return undefined;
    default:
      return 16 / 9;
  }
}

export function MediaCropDialog({ open, onOpenChange, imageSrc, onCropped }: MediaCropDialogProps) {
  const c = copy.builder.mediaLibrary.crop;

  const [preset, setPreset] = useState<AspectPresetId>('16:9');
  const [customW, setCustomW] = useState(16);
  const [customH, setCustomH] = useState(9);
  const [appliedCustomAspect, setAppliedCustomAspect] = useState(16 / 9);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const computedAspect = useMemo((): number | undefined => {
    if (preset === 'free') return undefined;
    if (preset === 'custom') return appliedCustomAspect;
    return aspectFromPreset(preset);
  }, [preset, appliedCustomAspect]);

  const cropperKey = useMemo(() => {
    if (preset === 'custom') return `custom-${appliedCustomAspect}`;
    return preset;
  }, [preset, appliedCustomAspect]);

  useEffect(() => {
    if (!open) return;
    setPreset('16:9');
    setCustomW(16);
    setCustomH(9);
    setAppliedCustomAspect(16 / 9);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [cropperKey]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const applyCustomRatio = useCallback(() => {
    const w =
      Number.isFinite(customW) && customW > 0 ? Math.min(100, Math.max(1, Math.round(customW))) : 16;
    const h =
      Number.isFinite(customH) && customH > 0 ? Math.min(100, Math.max(1, Math.round(customH))) : 9;
    setCustomW(w);
    setCustomH(h);
    setAppliedCustomAspect(w / h);
  }, [customW, customH]);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsWorking(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await Promise.resolve(onCropped(blob));
      onOpenChange(false);
    } finally {
      setIsWorking(false);
    }
  };

  const presetLabel = (id: AspectPresetId): string => {
    const labels: Record<AspectPresetId, string> = {
      free: c.free,
      '1:1': c.ratio1_1,
      '4:3': c.ratio4_3,
      '3:2': c.ratio3_2,
      '16:9': c.ratio16_9,
      '21:9': c.ratio21_9,
      '9:16': c.ratio9_16,
      '2:3': c.ratio2_3,
      custom: c.custom,
    };
    return labels[id];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
        </DialogHeader>
        {imageSrc && (
          <>
            <div className="space-y-2">
              <Label htmlFor="crop-aspect">{c.aspectRatio}</Label>
              <Select
                value={preset}
                onValueChange={(v) => {
                  const next = v as AspectPresetId;
                  setPreset(next);
                  if (next === 'custom') {
                    const w =
                      Number.isFinite(customW) && customW > 0
                        ? Math.min(100, Math.max(1, Math.round(customW)))
                        : 16;
                    const h =
                      Number.isFinite(customH) && customH > 0
                        ? Math.min(100, Math.max(1, Math.round(customH)))
                        : 9;
                    setCustomW(w);
                    setCustomH(h);
                    setAppliedCustomAspect(w / h);
                  }
                }}
              >
                <SelectTrigger id="crop-aspect" aria-label={c.aspectRatio}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'free',
                      '1:1',
                      '4:3',
                      '3:2',
                      '16:9',
                      '21:9',
                      '9:16',
                      '2:3',
                      'custom',
                    ] as const
                  ).map((id) => (
                    <SelectItem key={id} value={id}>
                      {presetLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preset === 'custom' && (
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{c.customDescription}</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="crop-w" className="text-xs">
                        {c.widthShort}
                      </Label>
                      <Input
                        id="crop-w"
                        type="number"
                        min={1}
                        max={100}
                        className="w-20"
                        value={customW}
                        onChange={(e) => setCustomW(Number(e.target.value))}
                      />
                    </div>
                    <span className="pb-2 text-muted-foreground" aria-hidden>
                      :
                    </span>
                    <div className="space-y-1">
                      <Label htmlFor="crop-h" className="text-xs">
                        {c.heightShort}
                      </Label>
                      <Input
                        id="crop-h"
                        type="number"
                        min={1}
                        max={100}
                        className="w-20"
                        value={customH}
                        onChange={(e) => setCustomH(Number(e.target.value))}
                      />
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={applyCustomRatio}>
                      {c.applyCustom}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative h-64 w-full overflow-hidden rounded-md bg-muted">
              <Cropper
                key={cropperKey}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={computedAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-3 py-2">
          <span className="text-sm text-muted-foreground shrink-0">Zoom</span>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            className="flex-1"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isWorking}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!croppedAreaPixels || isWorking}>
            {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Use cropped image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
