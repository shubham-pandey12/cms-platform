'use client';

import React from 'react';
import { ChevronLeft, Palette } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DimensionEditor } from './fields/DimensionEditor';
import type { ElementStylesEditorProps } from './types';
import type { StyleableElement } from '@/types/cms';

type AllowedProp = NonNullable<StyleableElement['allowedProperties']>[number];

const ALL_PROPS: AllowedProp[] = [
  'color',
  'backgroundColor',
  'fontSize',
  'fontWeight',
  'padding',
  'borderRadius',
  'margin',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'border',
];

const FONT_WEIGHTS = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'];

const getElementStylesMap = (config: Record<string, unknown>) =>
  (config.elementStyles as Record<string, Record<string, string>> | undefined) || {};

interface PropEditorProps {
  prop: AllowedProp;
  value: string;
  onChange: (value: string) => void;
  activeThemeTextColor?: string;
}

function PropEditor({ prop, value, onChange, activeThemeTextColor }: PropEditorProps) {
  switch (prop) {
    case 'color':
    case 'backgroundColor':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded border border-input cursor-pointer"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={prop === 'color' ? (activeThemeTextColor ?? '#000000') : '#ffffff'}
            className="h-8 text-sm flex-1"
          />
        </div>
      );

    case 'padding':
    case 'margin':
    case 'borderRadius':
      return (
        <DimensionEditor
          value={value}
          onChange={onChange}
          defaultUnit="px"
          labels={prop === 'borderRadius' ? { top: 'TL', right: 'TR', bottom: 'BR', left: 'BL' } : undefined}
        />
      );

    case 'fontWeight':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select weight…" />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'textTransform':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {TEXT_TRANSFORMS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. 16px, 1rem`}
          className="h-8 text-sm"
        />
      );
  }
}

function propLabel(prop: AllowedProp): string {
  const map: Record<AllowedProp, string> = {
    color: 'Text Color',
    backgroundColor: 'Background Color',
    fontSize: 'Font Size',
    fontWeight: 'Font Weight',
    padding: 'Padding',
    borderRadius: 'Border Radius',
    margin: 'Margin',
    letterSpacing: 'Letter Spacing',
    lineHeight: 'Line Height',
    textTransform: 'Text Transform',
    border: 'Border',
  };
  return map[prop] ?? prop;
}

export const ElementStylesEditor: React.FC<ElementStylesEditorProps> = ({
  styleableElements,
  config,
  activeTheme,
  onConfigChange,
}) => {
  if (styleableElements.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Element Styles
      </Label>

      <div className="space-y-3">
        {styleableElements.map((element) => {
          const currentElementStyles = getElementStylesMap(config);
          const elementStyles = currentElementStyles[element.name] || {};
          const propsToShow: AllowedProp[] = element.allowedProperties ?? ALL_PROPS;

          const updateElementStyle = (property: string, value: string) => {
            const updatedElementStyles = {
              ...currentElementStyles,
              [element.name]: {
                ...(currentElementStyles[element.name] || {}),
                [property]: value,
              },
            };
            onConfigChange('elementStyles', updatedElementStyles);
          };

          return (
            <Collapsible key={element.name} defaultOpen={false}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">{element.label}</span>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground transition-transform data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-3 space-y-4 bg-muted/30 rounded-lg mt-2">
                  {propsToShow.map((prop) => (
                    <div key={prop} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{propLabel(prop)}</Label>
                      <PropEditor
                        prop={prop}
                        value={elementStyles[prop] || ''}
                        onChange={(v) => updateElementStyle(prop, v)}
                        activeThemeTextColor={activeTheme.colors.text}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
