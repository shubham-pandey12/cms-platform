'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type LucideIconComponent = React.FC<{ className?: string; size?: number | string }>;

// Build the icon registry once — filter only valid icon components
const ALL_ICONS: [string, LucideIconComponent][] = Object.entries(LucideIcons).filter(
  ([, v]) => typeof v === 'function'
).map(([k, v]) => [k, v as unknown as LucideIconComponent]);

interface IconPickerProps {
  id?: string;
  value: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
}

export function IconPicker({ id, value, onChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? ALL_ICONS.filter(([name]) => name.toLowerCase().includes(q)).slice(0, 80) : ALL_ICONS.slice(0, 80);
  }, [query]);

  const SelectedIcon = value ? ALL_ICONS.find(([n]) => n === value)?.[1] ?? null : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="h-9 w-full justify-start gap-2 font-normal"
          disabled={disabled}
        >
          {SelectedIcon ? <SelectedIcon size={16} /> : <span className="text-muted-foreground">No icon</span>}
          <span className="flex-1 text-left truncate">{value || 'Choose icon…'}</span>
          {value && (
            <X
              className="w-3 h-3 text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex items-center gap-1 mb-2 px-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            className="h-7 border-none shadow-none focus-visible:ring-0 p-0 text-sm"
          />
        </div>
        <ScrollArea className="h-52">
          <div className="grid grid-cols-6 gap-1 p-1">
            {filtered.map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                title={name}
                className={`flex items-center justify-center h-8 w-8 rounded hover:bg-accent transition-colors ${value === name ? 'bg-accent ring-1 ring-primary' : ''}`}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <Icon size={16} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-6 text-xs text-muted-foreground text-center py-4">No icons found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
