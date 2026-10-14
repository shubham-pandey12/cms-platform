'use client';

import React, { useState, useEffect } from 'react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { themeToConfig } from '@/contexts/PageBuilder/constants';
import { getThemes } from '@/services/cmsApiService';
import type { ThemeDefinition } from '@/types/cms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { fontPairs } from './themesConstants';

export const ThemesTab: React.FC = () => {
  const { activeTheme, setActiveTheme } = usePageBuilder();
  const [selectedFont, setSelectedFont] = useState<string>(fontPairs[0].id);
  const [selectedBackground, setSelectedBackground] = useState('#ffffff');
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);

  useEffect(() => {
    getThemes().then(setThemes);
  }, []);

  useEffect(() => {
    setSelectedBackground(activeTheme.colors.background);
    const match = fontPairs.find(
      (fp) => fp.title === activeTheme.fonts.heading && fp.body === activeTheme.fonts.body
    );
    if (match) {
      setSelectedFont(match.id);
    }
  }, [
    activeTheme.id,
    activeTheme.colors.background,
    activeTheme.fonts.heading,
    activeTheme.fonts.body,
  ]);

  const handleThemeSelect = (theme: ThemeDefinition) => {
    setSelectedBackground(theme.colors.background);
    void setActiveTheme(themeToConfig(theme));
  };

  const handleFontSelect = (fontPair: (typeof fontPairs)[number]) => {
    setSelectedFont(fontPair.id);
    setActiveTheme({
      ...activeTheme,
      fonts: {
        heading: fontPair.title,
        body: fontPair.body,
      },
    });
  };

  const handleBackgroundSelect = (color: string) => {
    setSelectedBackground(color);
    setActiveTheme({
      ...activeTheme,
      colors: {
        ...activeTheme.colors,
        background: color,
      },
    });
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                className={cn(
                  'p-2 rounded-lg border-2 transition-all',
                  activeTheme.id === theme.id ? 'border-primary' : 'border-transparent hover:border-border'
                )}
              >
                <div className="aspect-[4/3] rounded overflow-hidden flex flex-col">
                  <div className="flex-1" style={{ backgroundColor: theme.colors.secondary }} />
                  <div className="h-1" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="h-2" style={{ backgroundColor: theme.colors.background }} />
                </div>
                <div className="text-xs text-center mt-1.5 text-foreground">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-2">Active Theme</div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: activeTheme.colors.primary }}
            />
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: activeTheme.colors.secondary }}
            />
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: activeTheme.colors.accent }}
            />
            <span className="text-sm font-medium ml-2">{activeTheme.name}</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Font style</h3>
          <div className="space-y-2">
            {fontPairs.map((font) => (
              <button
                key={font.id}
                onClick={() => handleFontSelect(font)}
                className={cn(
                  'w-full p-3 rounded-lg border transition-colors text-left',
                  selectedFont === font.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                )}
              >
                <div className="text-sm font-semibold text-foreground mb-0.5">{font.title}</div>
                <div className="text-xs text-muted-foreground">Body: {font.body}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Background</h3>
          <div className="grid grid-cols-5 gap-2">
            {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#1a1a2e'].map((color) => (
              <button
                key={color}
                onClick={() => handleBackgroundSelect(color)}
                className={cn(
                  'aspect-square rounded-lg border-2 transition-colors',
                  selectedBackground === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
