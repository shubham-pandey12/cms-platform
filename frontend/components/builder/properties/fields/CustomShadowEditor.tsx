'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { CustomShadow } from '@/types/cms';

const DEFAULT_SHADOW: CustomShadow = { offsetX: 0, offsetY: 4, blur: 6, spread: 0, color: 'rgba(0,0,0,0.1)' };

export function shadowToCSS(shadow: CustomShadow): string {
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
}

interface CustomShadowEditorProps {
  value: CustomShadow | null;
  onChange: (shadow: CustomShadow) => void;
  disabled?: boolean;
}

export function CustomShadowEditor({ value, onChange, disabled }: CustomShadowEditorProps) {
  const s = value ?? DEFAULT_SHADOW;
  const update = (partial: Partial<CustomShadow>) => onChange({ ...s, ...partial });

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-md">
      {/* Preview */}
      <div
        className="h-8 w-full rounded bg-background border border-input"
        style={{ boxShadow: shadowToCSS(s) }}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">X: {s.offsetX}px</Label>
          <Slider value={[s.offsetX]} onValueChange={([v]) => update({ offsetX: v })} min={-50} max={50} step={1} disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Y: {s.offsetY}px</Label>
          <Slider value={[s.offsetY]} onValueChange={([v]) => update({ offsetY: v })} min={-50} max={50} step={1} disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Blur: {s.blur}px</Label>
          <Slider value={[s.blur]} onValueChange={([v]) => update({ blur: v })} min={0} max={100} step={1} disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Spread: {s.spread}px</Label>
          <Slider value={[s.spread]} onValueChange={([v]) => update({ spread: v })} min={-50} max={50} step={1} disabled={disabled} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#/.test(s.color) ? s.color : '#000000'}
          onChange={(e) => update({ color: e.target.value })}
          className="w-8 h-8 rounded border border-input cursor-pointer shrink-0"
          disabled={disabled}
        />
        <Input
          value={s.color}
          onChange={(e) => update({ color: e.target.value })}
          placeholder="rgba(0,0,0,0.1)"
          className="h-8 text-sm flex-1"
          disabled={disabled}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <Label className="text-xs text-muted-foreground">Inset</Label>
          <Switch checked={Boolean(s.inset)} onCheckedChange={(v) => update({ inset: v })} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
