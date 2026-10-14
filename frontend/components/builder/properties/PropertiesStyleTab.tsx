'use client';

import React, { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ChevronDown, Palette, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CustomShadowEditor } from './fields/CustomShadowEditor';
import { ElementStylesEditor } from './ElementStylesEditor';
import type { PropertiesStyleTabProps } from './types';
import type { CustomShadow, Responsive } from '@/types/cms';

type Breakpoint = 'base' | 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS: Array<{ key: Breakpoint; label: string }> = [
  { key: 'base', label: 'All' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'desktop', label: 'Desktop' },
];

function getResponsiveValue<T>(responsive: Responsive<T> | undefined, bp: Breakpoint): T | undefined {
  if (responsive === undefined) return undefined;
  if (bp === 'base' || typeof responsive !== 'object' || responsive === null || Array.isArray(responsive)) {
    return responsive as T;
  }
  const r = responsive as { mobile?: T; tablet?: T; desktop?: T };
  return r[bp as 'mobile' | 'tablet' | 'desktop'];
}

function setResponsiveValue<T>(current: Responsive<T> | undefined, bp: Breakpoint, value: T): Responsive<T> {
  if (bp === 'base') return value;
  const base: { mobile?: T; tablet?: T; desktop?: T } =
    typeof current === 'object' && current !== null && !Array.isArray(current)
      ? { ...(current as { mobile?: T; tablet?: T; desktop?: T }) }
      : {};
  return { ...base, [bp]: value };
}

const PRESET_SPACINGS = ['none', 'sm', 'md', 'lg', 'xl'] as const;
const PRESET_SHADOWS = ['none', 'sm', 'md', 'lg', 'xl'] as const;

export const PropertiesStyleTab: React.FC<PropertiesStyleTabProps> = ({
  config,
  styles,
  activeTheme,
  styleableElements,
  onConfigChange,
  onStyleChange,
  paddingOptions,
  savedColors,
}) => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('base');
  const [customShadowOpen, setCustomShadowOpen] = useState(false);

  const backgroundColor = (styles.backgroundColor as string) || '';
  const textColor = (styles.textColor as string) || '';
  const padding = getResponsiveValue(styles.padding as Responsive<string>, breakpoint) ?? 'md';
  const shadow = styles.shadow as string | CustomShadow | undefined;
  const isCustomShadow = typeof shadow === 'object' && shadow !== null;
  const presetShadow = isCustomShadow ? 'none' : ((shadow as string) || 'none');
  const opacity = (styles.opacity as number | undefined) ?? 100;
  const borderRadius = (styles.borderRadius as number) || 0;
  const borderWidth = (styles.borderWidth as number) || 0;
  const borderColor = (styles.borderColor as string) || '';
  const alignment = config.alignment as string;

  const handlePaddingChange = (value: string) => {
    const next = setResponsiveValue(styles.padding as Responsive<string>, breakpoint, value);
    onStyleChange('padding', next);
  };

  // Build background color palette: theme tokens + saved brand swatches + a few static defaults
  const swatches = [
    activeTheme.colors.primary,
    activeTheme.colors.secondary,
    activeTheme.colors.accent,
    activeTheme.colors.background,
    '#ffffff',
    '#1e293b',
    'transparent',
    ...(savedColors ?? []),
  ];

  return (
    <TabsContent value="style" className="flex-1 overflow-hidden mt-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">

          {/* Breakpoint toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Breakpoint overrides</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {BREAKPOINTS.map((bp) => (
                <Button
                  key={bp.key}
                  variant={breakpoint === bp.key ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => setBreakpoint(bp.key)}
                >
                  {bp.label}
                </Button>
              ))}
            </div>
            {breakpoint !== 'base' && (
              <p className="text-xs text-muted-foreground">
                Overrides apply only at the <strong>{breakpoint}</strong> breakpoint.
              </p>
            )}
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Text Alignment</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ].map((align) => (
                <Button
                  key={align.value}
                  variant={alignment === align.value ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onConfigChange('alignment', align.value)}
                >
                  <align.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Theme color tokens */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Background Color
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {swatches.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  className={cn(
                    'w-7 h-7 rounded border-2 transition-colors shrink-0',
                    backgroundColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'
                  )}
                  style={{
                    backgroundColor: color === 'transparent' ? 'transparent' : color,
                    backgroundImage:
                      color === 'transparent'
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                  }}
                  title={color}
                  onClick={() => onStyleChange('backgroundColor', color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(event) => onStyleChange('backgroundColor', event.target.value)}
                className="w-8 h-8 rounded border border-input cursor-pointer"
              />
              <Input
                value={backgroundColor}
                onChange={(event) => onStyleChange('backgroundColor', event.target.value)}
                placeholder="Custom color"
                className="h-8 text-sm flex-1"
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Text Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor || activeTheme.colors.text}
                onChange={(event) => onStyleChange('textColor', event.target.value)}
                className="w-10 h-9 rounded border border-input cursor-pointer"
              />
              <Input
                value={textColor}
                onChange={(event) => onStyleChange('textColor', event.target.value)}
                placeholder={activeTheme.colors.text}
                className="h-9 flex-1"
              />
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Padding</Label>
            <Select value={padding as string} onValueChange={handlePaddingChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paddingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.px})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Margin</Label>
            <Select
              value={(getResponsiveValue(styles.margin as Responsive<string>, breakpoint) as string) ?? 'none'}
              onValueChange={(v) => onStyleChange('margin', setResponsiveValue(styles.margin as Responsive<string>, breakpoint, v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_SPACINGS.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'none' ? 'None' : s.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Border */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium py-1 hover:text-primary transition-colors">
              <ChevronDown className="w-4 h-4 shrink-0 data-[state=open]:rotate-180 transition-transform" />
              Border
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Width (px)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[borderWidth]}
                      onValueChange={([v]) => onStyleChange('borderWidth', v)}
                      min={0}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-6 text-right">{borderWidth}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={borderColor || '#000000'}
                      onChange={(e) => onStyleChange('borderColor', e.target.value)}
                      className="w-8 h-8 rounded border border-input cursor-pointer"
                    />
                    <Input
                      value={borderColor}
                      onChange={(e) => onStyleChange('borderColor', e.target.value)}
                      placeholder="#000000"
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Border Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Border Radius</Label>
              <span className="text-xs text-muted-foreground">{borderRadius}px</span>
            </div>
            <Slider
              value={[borderRadius]}
              onValueChange={([nextValue]) => onStyleChange('borderRadius', nextValue)}
              max={32}
              step={2}
            />
          </div>

          {/* Shadow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Shadow</Label>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs transition-colors cursor-pointer select-none',
                  customShadowOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setCustomShadowOpen((prev) => !prev)}
              >
                <Settings2 className="w-3 h-3" />
                Custom
                <Switch
                  checked={customShadowOpen}
                  onCheckedChange={setCustomShadowOpen}
                  className="scale-75 ml-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {!customShadowOpen ? (
              <Select
                value={presetShadow}
                onValueChange={(v) => onStyleChange('shadow', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SHADOWS.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'none' ? 'None' : s.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <CustomShadowEditor
                value={isCustomShadow ? (shadow as CustomShadow) : null}
                onChange={(cs) => onStyleChange('shadow', cs)}
              />
            )}
          </div>

          {/* Opacity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Opacity</Label>
              <span className="text-xs text-muted-foreground">{opacity}%</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={([nextValue]) => onStyleChange('opacity', nextValue)}
              max={100}
              min={0}
              step={5}
            />
          </div>

          {/* Element Styles */}
          {styleableElements && styleableElements.length > 0 && (
            <ElementStylesEditor
              styleableElements={styleableElements}
              config={config}
              activeTheme={activeTheme}
              onConfigChange={onConfigChange}
            />
          )}
        </div>
      </ScrollArea>
    </TabsContent>
  );
};
