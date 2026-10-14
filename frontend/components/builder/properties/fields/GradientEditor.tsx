'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

const DEFAULT_GRADIENT: GradientValue = {
  type: 'linear',
  angle: 90,
  stops: [
    { color: '#000000', position: 0 },
    { color: '#ffffff', position: 100 },
  ],
};

function toCSS(g: GradientValue): string {
  const stops = g.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (g.type === 'radial') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

interface GradientEditorProps {
  id?: string;
  value: GradientValue | null;
  onChange: (val: GradientValue) => void;
  disabled?: boolean;
}

export function GradientEditor({ id, value, onChange, disabled }: GradientEditorProps) {
  const g = value ?? DEFAULT_GRADIENT;

  const update = (partial: Partial<GradientValue>) => onChange({ ...g, ...partial });
  const updateStop = (index: number, partial: Partial<GradientValue['stops'][0]>) => {
    const stops = g.stops.map((s, i) => (i === index ? { ...s, ...partial } : s));
    onChange({ ...g, stops });
  };

  return (
    <div id={id} className="space-y-3">
      {/* Preview */}
      <div
        className="h-8 w-full rounded border border-input"
        style={{ background: toCSS(g) }}
      />

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={g.type} onValueChange={(v) => update({ type: v as GradientValue['type'] })} disabled={disabled}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {g.type === 'linear' && (
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Angle: {g.angle}°</Label>
            <Slider
              value={[g.angle]}
              onValueChange={([v]) => update({ angle: v })}
              min={0}
              max={360}
              step={1}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Color stops */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Color stops</Label>
        {g.stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(i, { color: e.target.value })}
              className="w-8 h-8 rounded border border-input cursor-pointer shrink-0"
              disabled={disabled}
            />
            <Slider
              value={[stop.position]}
              onValueChange={([v]) => updateStop(i, { position: v })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
              disabled={disabled}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">{stop.position}%</span>
          </div>
        ))}
      </div>

      {/* CSS output */}
      <Input
        value={toCSS(g)}
        readOnly
        className="h-8 text-xs font-mono text-muted-foreground"
      />
    </div>
  );
}
