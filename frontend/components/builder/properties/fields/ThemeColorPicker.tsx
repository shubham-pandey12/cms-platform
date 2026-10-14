'use client';

import React, { useState } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ThemeColorValue {
  token?: string;
  value: string;
}

const THEME_TOKENS = ['primary', 'secondary', 'accent', 'background', 'text'] as const;

interface ThemeColorPickerProps {
  id?: string;
  value: ThemeColorValue | null;
  onChange: (val: ThemeColorValue) => void;
  disabled?: boolean;
}

export function ThemeColorPicker({ id, value, onChange, disabled }: ThemeColorPickerProps) {
  const { activeTheme } = usePageBuilder();
  const [open, setOpen] = useState(false);

  const currentHex = value?.value ?? '#000000';
  const currentToken = value?.token;

  const themeTokenColors: Record<string, string> = {
    primary: activeTheme.colors.primary,
    secondary: activeTheme.colors.secondary,
    accent: activeTheme.colors.accent,
    background: activeTheme.colors.background,
    text: activeTheme.colors.text,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 h-9 px-3 w-full rounded-md border border-input bg-background text-sm hover:bg-accent/50 transition-colors',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          <span
            className="w-5 h-5 rounded border border-input shrink-0"
            style={{ backgroundColor: currentHex }}
          />
          <span className="flex-1 text-left truncate">
            {currentToken ? `theme.${currentToken}` : currentHex}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="start">
        {/* Theme tokens */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme tokens</p>
          <div className="grid grid-cols-5 gap-1">
            {THEME_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                title={`theme.${token}`}
                className={cn(
                  'aspect-square rounded border-2 transition-colors',
                  currentToken === token ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary'
                )}
                style={{ backgroundColor: themeTokenColors[token] }}
                onClick={() => {
                  onChange({ token, value: themeTokenColors[token] });
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <div className="flex gap-0.5 text-[10px] text-muted-foreground">
            {THEME_TOKENS.map((t) => (
              <span key={t} className="flex-1 text-center truncate">{t}</span>
            ))}
          </div>
        </div>

        {/* Custom hex */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentHex}
              onChange={(e) => onChange({ value: e.target.value })}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={currentHex}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="#000000"
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
