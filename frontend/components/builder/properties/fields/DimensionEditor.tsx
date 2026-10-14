'use client';

import React, { useState } from 'react';
import { Link2, Unlink2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DimensionValue {
  top: string;
  right: string;
  bottom: string;
  left: string;
  unit: 'px' | 'rem' | '%';
}

/** Parse a CSS shorthand string like "8px 16px" into a DimensionValue */
export function parseDimension(raw: string | undefined, defaultUnit: 'px' | 'rem' | '%' = 'px'): DimensionValue {
  if (!raw) return { top: '0', right: '0', bottom: '0', left: '0', unit: defaultUnit };
  const unit = (/rem|px|%/.exec(raw)?.[0] as 'px' | 'rem' | '%') ?? defaultUnit;
  const nums = raw.replace(/[a-z%]/gi, ' ').trim().split(/\s+/).map((n) => n || '0');
  const [t = '0', r = t, b = t, l = r] = nums;
  return { top: t, right: r, bottom: b, left: l, unit };
}

/** Serialize a DimensionValue back to a CSS shorthand string */
export function serializeDimension(d: DimensionValue): string {
  const u = d.unit;
  if (d.top === d.right && d.right === d.bottom && d.bottom === d.left) {
    return `${d.top}${u}`;
  }
  if (d.top === d.bottom && d.left === d.right) {
    return `${d.top}${u} ${d.right}${u}`;
  }
  return `${d.top}${u} ${d.right}${u} ${d.bottom}${u} ${d.left}${u}`;
}

interface DimensionEditorProps {
  id?: string;
  value: string;
  onChange: (css: string) => void;
  defaultUnit?: 'px' | 'rem' | '%';
  disabled?: boolean;
  labels?: { top?: string; right?: string; bottom?: string; left?: string };
}

export function DimensionEditor({ id, value, onChange, defaultUnit = 'px', disabled, labels }: DimensionEditorProps) {
  const parsed = parseDimension(value, defaultUnit);
  const [linked, setLinked] = useState(
    parsed.top === parsed.right && parsed.right === parsed.bottom && parsed.bottom === parsed.left
  );

  const update = (side: keyof Omit<DimensionValue, 'unit'>, val: string) => {
    const next = { ...parsed };
    if (linked) {
      next.top = val;
      next.right = val;
      next.bottom = val;
      next.left = val;
    } else {
      next[side] = val;
    }
    onChange(serializeDimension(next));
  };

  const updateUnit = (unit: 'px' | 'rem' | '%') => {
    onChange(serializeDimension({ ...parsed, unit }));
  };

  const sides = [
    { key: 'top' as const, label: labels?.top ?? 'T' },
    { key: 'right' as const, label: labels?.right ?? 'R' },
    { key: 'bottom' as const, label: labels?.bottom ?? 'B' },
    { key: 'left' as const, label: labels?.left ?? 'L' },
  ];

  return (
    <div id={id} className="flex items-center gap-1">
      {sides.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center gap-0.5 flex-1">
          <Input
            value={parsed[key]}
            onChange={(e) => update(key, e.target.value)}
            className="h-8 text-xs text-center px-1"
            placeholder="0"
            disabled={disabled}
          />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 mt-0"
        onClick={() => setLinked((prev) => !prev)}
        disabled={disabled}
        title={linked ? 'Unlink sides' : 'Link all sides'}
      >
        {linked ? <Link2 className="w-4 h-4" /> : <Unlink2 className="w-4 h-4" />}
      </Button>
      <Select value={parsed.unit} onValueChange={updateUnit} disabled={disabled}>
        <SelectTrigger className="h-8 w-14 text-xs px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="px">px</SelectItem>
          <SelectItem value="rem">rem</SelectItem>
          <SelectItem value="%">%</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
