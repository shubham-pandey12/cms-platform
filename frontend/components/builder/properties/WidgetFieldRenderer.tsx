'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { widgetPropertyRegistry } from '@/lib/widgetPropertyRegistry';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { RichTextEditor } from './fields/RichTextEditor';
import { IconPicker } from './fields/IconPicker';
import { LinkPicker } from './fields/LinkPicker';
import { DimensionEditor } from './fields/DimensionEditor';
import { ThemeColorPicker } from './fields/ThemeColorPicker';
import { GradientEditor } from './fields/GradientEditor';
import type { LocalizedTextViewMode, WidgetFieldRendererProps } from './types';

// ---- Localized text helpers ----

function LocalizedTextTabbedField({
  fieldName,
  placeholder,
  obj,
  locales,
  onConfigChange,
}: {
  fieldName: string;
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onConfigChange: (name: string, value: Record<string, string>) => void;
}) {
  const [activeLocale, setActiveLocale] = useState(locales[0] ?? DEFAULT_LANG);
  const effectiveLocale = locales.includes(activeLocale) ? activeLocale : (locales[0] ?? DEFAULT_LANG);
  return (
    <Tabs value={effectiveLocale} onValueChange={setActiveLocale} className="w-full">
      <TabsList className="h-8 w-full grid text-xs" style={{ gridTemplateColumns: `repeat(${locales.length}, minmax(0, 1fr))` }}>
        {locales.map((locale) => (
          <TabsTrigger key={locale} value={locale} className="px-2 text-xs">
            {locale.toUpperCase()}
          </TabsTrigger>
        ))}
      </TabsList>
      {locales.map((locale) => (
        <TabsContent key={locale} value={locale} className="mt-2">
          <Input
            id={`${fieldName}-${locale}`}
            value={obj[locale] ?? ''}
            onChange={(event) => onConfigChange(fieldName, { ...obj, [locale]: event.target.value })}
            placeholder={placeholder}
            className="h-9"
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function LocalizedTextStackedField({
  fieldName,
  placeholder,
  obj,
  locales,
  onConfigChange,
}: {
  fieldName: string;
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onConfigChange: (name: string, value: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-3">
      {locales.map((locale) => (
        <div key={locale} className="space-y-1">
          <Label htmlFor={`${fieldName}-${locale}`} className="text-xs text-muted-foreground">
            {locale.toUpperCase()}
          </Label>
          <Input
            id={`${fieldName}-${locale}`}
            value={obj[locale] ?? ''}
            onChange={(event) => onConfigChange(fieldName, { ...obj, [locale]: event.target.value })}
            placeholder={placeholder}
            className="h-9"
          />
        </div>
      ))}
    </div>
  );
}

function LocalizedTextDropdownField({
  fieldName,
  placeholder,
  obj,
  locales,
  onConfigChange,
}: {
  fieldName: string;
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onConfigChange: (name: string, value: Record<string, string>) => void;
}) {
  const [selectedLocale, setSelectedLocale] = useState(locales[0] ?? DEFAULT_LANG);
  const effectiveLocale = locales.includes(selectedLocale) ? selectedLocale : (locales[0] ?? DEFAULT_LANG);
  return (
    <div className="space-y-2">
      <Select value={effectiveLocale} onValueChange={setSelectedLocale}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {locale.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={fieldName}
        value={obj[effectiveLocale] ?? ''}
        onChange={(event) =>
          onConfigChange(fieldName, { ...obj, [effectiveLocale]: event.target.value })
        }
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

// ---- Inline validation ----

function validateField(field: WidgetFieldRendererProps['field'], value: unknown): string | null {
  const v = field.validation;
  if (!v) return null;

  if (typeof value === 'string') {
    if (v.min !== undefined && value.length < v.min) {
      return v.message ?? `Minimum ${v.min} characters required.`;
    }
    if (v.max !== undefined && value.length > v.max) {
      return v.message ?? `Maximum ${v.max} characters allowed.`;
    }
    if (v.pattern && !new RegExp(v.pattern).test(value)) {
      return v.message ?? 'Value does not match required format.';
    }
  }

  if (typeof value === 'number') {
    if (v.min !== undefined && value < v.min) {
      return v.message ?? `Minimum value is ${v.min}.`;
    }
    if (v.max !== undefined && value > v.max) {
      return v.message ?? `Maximum value is ${v.max}.`;
    }
  }

  return null;
}

// ---- Main renderer ----

export const WidgetFieldRenderer: React.FC<WidgetFieldRendererProps> = ({
  field,
  value,
  onConfigChange,
  onOpenMediaLibrary,
  supportedLangs,
  localizedTextView = 'tabbed',
  apiCalls,
}) => {
  // Check plugin registry first
  if (field.component) {
    const CustomRenderer = widgetPropertyRegistry.getFieldRenderer(field.component);
    if (CustomRenderer) {
      return (
        <CustomRenderer
          field={field}
          value={value}
          onConfigChange={onConfigChange}
          onOpenMediaLibrary={onOpenMediaLibrary}
          supportedLangs={supportedLangs}
          localizedTextView={localizedTextView}
          apiCalls={apiCalls}
        />
      );
    }
  }

  const validationError = validateField(field, value);

  const wrap = (children: React.ReactNode) => (
    <>
      {children}
      {validationError && (
        <p className="text-xs text-destructive mt-1">{validationError}</p>
      )}
    </>
  );

  switch (field.type) {
    case 'text':
      return wrap(
        <Input
          id={field.name}
          value={(value as string) || ''}
          onChange={(event) => onConfigChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className="h-9"
        />
      );

    case 'textarea':
      return wrap(
        <Textarea
          id={field.name}
          value={(value as string) || ''}
          onChange={(event) => onConfigChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      );

    case 'richtext':
      return wrap(
        <RichTextEditor
          id={field.name}
          value={(value as string) || ''}
          onChange={(html) => onConfigChange(field.name, html)}
          placeholder={field.placeholder}
          maxLength={field.validation?.max}
        />
      );

    case 'number':
      return wrap(
        <Input
          id={field.name}
          type="number"
          value={(value as number) || 0}
          onChange={(event) => onConfigChange(field.name, parseFloat(event.target.value))}
          min={field.validation?.min}
          max={field.validation?.max}
          className="h-9"
        />
      );

    case 'toggle':
      return (
        <Switch
          id={field.name}
          checked={(value as boolean) || false}
          onCheckedChange={(checked) => onConfigChange(field.name, checked)}
        />
      );

    case 'select':
      return wrap(
        <Select value={(value as string) || ''} onValueChange={(nextValue) => onConfigChange(field.name, nextValue)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'color':
      return wrap(
        <div className="flex items-center gap-2">
          <input
            type="color"
            id={field.name}
            value={(value as string) || '#000000'}
            onChange={(event) => onConfigChange(field.name, event.target.value)}
            className="w-10 h-9 rounded border border-input cursor-pointer"
          />
          <Input
            value={(value as string) || ''}
            onChange={(event) => onConfigChange(field.name, event.target.value)}
            placeholder="#000000"
            className="h-9 flex-1"
          />
        </div>
      );

    case 'media':
      return (
        <div className="space-y-2">
          {value && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={value as string}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 z-10"
                onClick={() => onConfigChange(field.name, '')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Input
            id={field.name}
            value={(value as string) || ''}
            onChange={(event) => onConfigChange(field.name, event.target.value)}
            placeholder="Enter image URL..."
            className="h-9"
          />
          <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenMediaLibrary(field.name)}>
            Browse Media Library
          </Button>
        </div>
      );

    case 'data-binding': {
      // Build options from page API calls (dynamic) supplemented by field.dataBindingSources hints
      const dynamicOptions: Array<{ label: string; value: string }> = (apiCalls ?? []).map((c) => ({
        label: c.name || c.id,
        value: c.id,
      }));
      const staticOptions: Array<{ label: string; value: string }> = (field.dataBindingSources ?? []).map((src) => ({
        label: src,
        value: src,
      }));
      // Deduplicate
      const seen = new Set<string>();
      const allOptions = [...dynamicOptions, ...staticOptions, { label: 'Manual', value: 'manual' }].filter((o) => {
        if (seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });

      return (
        <Select value={(value as string) || ''} onValueChange={(nextValue) => onConfigChange(field.name, nextValue)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select data source..." />
          </SelectTrigger>
          <SelectContent>
            {allOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case 'iconPicker':
      return (
        <IconPicker
          id={field.name}
          value={(value as string) || ''}
          onChange={(icon) => onConfigChange(field.name, icon)}
        />
      );

    case 'linkPicker':
      return (
        <LinkPicker
          id={field.name}
          value={(value as import('./fields/LinkPicker').LinkValue) || null}
          onChange={(link) => onConfigChange(field.name, link)}
        />
      );

    case 'dimension':
      return (
        <DimensionEditor
          id={field.name}
          value={(value as string) || ''}
          onChange={(css) => onConfigChange(field.name, css)}
          defaultUnit={field.unit ?? 'px'}
        />
      );

    case 'themeColor':
      return (
        <ThemeColorPicker
          id={field.name}
          value={(value as import('./fields/ThemeColorPicker').ThemeColorValue) || null}
          onChange={(tc) => onConfigChange(field.name, tc)}
        />
      );

    case 'gradient':
      return (
        <GradientEditor
          id={field.name}
          value={(value as import('./fields/GradientEditor').GradientValue) || null}
          onChange={(g) => onConfigChange(field.name, g)}
        />
      );

    case 'json':
      return wrap(
        <Textarea
          id={field.name}
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(event) => {
            try {
              const parsed = JSON.parse(event.target.value);
              onConfigChange(field.name, parsed);
            } catch {
              onConfigChange(field.name, event.target.value);
            }
          }}
          placeholder='{"key": "value"}'
          rows={6}
          className="font-mono text-xs"
        />
      );

    case 'code':
      return wrap(
        <Textarea
          id={field.name}
          value={(value as string) || ''}
          onChange={(event) => onConfigChange(field.name, event.target.value)}
          placeholder={field.placeholder ?? '// Enter code here'}
          rows={8}
          className="font-mono text-xs"
        />
      );

    case 'dateTime':
      return wrap(
        <Input
          id={field.name}
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(event) => onConfigChange(field.name, event.target.value)}
          className="h-9"
        />
      );

    case 'range':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{field.validation?.min ?? 0}</span>
            <span className="text-xs font-medium">{(value as number) ?? field.validation?.min ?? 0}</span>
            <span className="text-xs text-muted-foreground">{field.validation?.max ?? 100}</span>
          </div>
          <Slider
            id={field.name}
            value={[(value as number) ?? field.validation?.min ?? 0]}
            onValueChange={([v]) => onConfigChange(field.name, v)}
            min={field.validation?.min ?? 0}
            max={field.validation?.max ?? 100}
            step={1}
          />
        </div>
      );

    case 'array':
      return (
        <ArrayFieldEditor
          field={field}
          value={(value as Record<string, unknown>[]) || []}
          onChange={(newValue) => onConfigChange(field.name, newValue)}
          supportedLangs={supportedLangs}
          localizedTextView={localizedTextView}
        />
      );

    case 'localizedText': {
      const raw = (supportedLangs?.length ? supportedLangs : field.langs) ?? [DEFAULT_LANG];
      const locales = raw.length ? raw : [DEFAULT_LANG];
      const obj: Record<string, string> =
        typeof value === 'string'
          ? { [DEFAULT_LANG]: value }
          : value != null && typeof value === 'object' && !Array.isArray(value)
            ? { ...(value as Record<string, string>) }
            : {};
      if (localizedTextView === 'stacked') {
        return (
          <LocalizedTextStackedField
            fieldName={field.name}
            placeholder={field.placeholder}
            obj={obj}
            locales={locales}
            onConfigChange={onConfigChange}
          />
        );
      }
      if (localizedTextView === 'dropdown') {
        return (
          <LocalizedTextDropdownField
            fieldName={field.name}
            placeholder={field.placeholder}
            obj={obj}
            locales={locales}
            onConfigChange={onConfigChange}
          />
        );
      }
      return (
        <LocalizedTextTabbedField
          fieldName={field.name}
          placeholder={field.placeholder}
          obj={obj}
          locales={locales}
          onConfigChange={onConfigChange}
        />
      );
    }

    default:
      return (
        <Input
          id={field.name}
          value={(value as string) || ''}
          onChange={(event) => onConfigChange(field.name, event.target.value)}
          className="h-9"
        />
      );
  }
};
