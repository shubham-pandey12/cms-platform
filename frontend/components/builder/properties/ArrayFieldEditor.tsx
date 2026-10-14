'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import type { WidgetConfigField } from '@/types/cms';
import type { LocalizedTextViewMode } from './types';

/** Resolves a value to a string for use as array item label (handles localizedText objects). */
function getItemLabel(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return getLocalizedValue(value, DEFAULT_LANG);
}

function LocalizedTextTabbedField({
  fieldName,
  placeholder,
  obj,
  locales,
  onUpdate,
}: {
  fieldName: string;
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onUpdate: (value: Record<string, string>) => void;
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
            value={obj[locale] ?? ''}
            onChange={(event) => onUpdate({ ...obj, [locale]: event.target.value })}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function LocalizedTextStackedItemField({
  placeholder,
  obj,
  locales,
  onUpdate,
}: {
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onUpdate: (value: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-2">
      {locales.map((locale) => (
        <div key={locale} className="space-y-1">
          <Label className="text-xs text-muted-foreground">{locale.toUpperCase()}</Label>
          <Input
            value={obj[locale] ?? ''}
            onChange={(event) => onUpdate({ ...obj, [locale]: event.target.value })}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

function LocalizedTextDropdownItemField({
  placeholder,
  obj,
  locales,
  onUpdate,
}: {
  placeholder?: string;
  obj: Record<string, string>;
  locales: string[];
  onUpdate: (value: Record<string, string>) => void;
}) {
  const [selectedLocale, setSelectedLocale] = useState(locales[0] ?? DEFAULT_LANG);
  const effectiveLocale = locales.includes(selectedLocale) ? selectedLocale : (locales[0] ?? DEFAULT_LANG);
  return (
    <div className="space-y-2">
      <Select value={effectiveLocale} onValueChange={setSelectedLocale}>
        <SelectTrigger className="h-8 text-sm">
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
        value={obj[effectiveLocale] ?? ''}
        onChange={(event) => onUpdate({ ...obj, [effectiveLocale]: event.target.value })}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

interface ArrayFieldEditorProps {
  field: WidgetConfigField;
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  supportedLangs?: string[];
  localizedTextView?: LocalizedTextViewMode;
}

// ---- Sortable item wrapper ----

interface SortableItemProps {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// ---- Main component ----

export const ArrayFieldEditor: React.FC<ArrayFieldEditorProps> = ({
  field,
  value,
  onChange,
  supportedLangs,
  localizedTextView = 'tabbed',
}) => {
  const items = value || [];
  const schema = field.arrayItemSchema || [];
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleOpen = useCallback((index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const addItem = () => {
    const newItem: Record<string, unknown> = { id: `item-${Date.now()}` };
    schema.forEach((schemaField) => {
      if (schemaField.type === 'array') {
        newItem[schemaField.name] = [];
      } else if (schemaField.type === 'toggle') {
        newItem[schemaField.name] = schemaField.defaultValue ?? false;
      } else if (schemaField.type === 'localizedText') {
        const raw = (supportedLangs?.length ? supportedLangs : schemaField.langs) ?? [DEFAULT_LANG];
        const locales = raw.length ? raw : [DEFAULT_LANG];
        newItem[schemaField.name] = Object.fromEntries(locales.map((l) => [l, '']));
      } else {
        newItem[schemaField.name] = schemaField.defaultValue ?? '';
      }
    });
    const next = [...items, newItem];
    onChange(next);
    setOpenIndices(new Set([next.length - 1]));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setOpenIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => { if (i < index) next.add(i); else if (i > index) next.add(i - 1); });
      return next;
    });
  };

  const duplicateItem = (index: number) => {
    const copy = { ...items[index], id: `item-${Date.now()}` };
    const next = [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
    onChange(next);
    setOpenIndices((prev) => new Set([...prev, index + 1]));
  };

  const updateItem = (index: number, fieldName: string, fieldValue: unknown) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [fieldName]: fieldValue } : item)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => (item.id as string) === active.id);
    const newIndex = items.findIndex((item) => (item.id as string) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const itemIds = items.map((item, i) => (item.id as string) || `fallback-${i}`);

  const renderItemField = (
    itemField: WidgetConfigField,
    item: Record<string, unknown>,
    itemIndex: number
  ) => {
    const fieldValue = item[itemField.name];

    switch (itemField.type) {
      case 'text':
        return (
          <Input
            value={(fieldValue as string) || ''}
            onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
            placeholder={itemField.placeholder}
            className="h-8 text-sm"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={(fieldValue as string) || ''}
            onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
            placeholder={itemField.placeholder}
            rows={3}
            className="text-sm"
          />
        );
      case 'select':
        return (
          <Select
            value={(fieldValue as string) || ''}
            onValueChange={(nextValue) => updateItem(itemIndex, itemField.name, nextValue)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {itemField.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'toggle':
        return (
          <Switch
            checked={(fieldValue as boolean) || false}
            onCheckedChange={(checked) => updateItem(itemIndex, itemField.name, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(fieldValue as number) || 0}
            onChange={(event) => updateItem(itemIndex, itemField.name, parseFloat(event.target.value) || 0)}
            min={itemField.validation?.min}
            max={itemField.validation?.max}
            className="h-8 text-sm"
          />
        );
      case 'media':
        return (
          <div className="space-y-2">
            {fieldValue && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={fieldValue as string}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 z-10"
                  onClick={() => updateItem(itemIndex, itemField.name, '')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <Input
              value={(fieldValue as string) || ''}
              onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
              placeholder="Enter image URL or browse media..."
              className="h-8 text-sm"
            />
          </div>
        );
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(fieldValue as string) || '#000000'}
              onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={(fieldValue as string) || ''}
              onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
              placeholder="#000000"
              className="h-8 text-sm flex-1"
            />
          </div>
        );
      case 'array':
        return (
          <ArrayFieldEditor
            field={itemField}
            value={(fieldValue as Record<string, unknown>[]) || []}
            onChange={(newValue) => updateItem(itemIndex, itemField.name, newValue)}
            supportedLangs={supportedLangs}
            localizedTextView={localizedTextView}
          />
        );
      case 'localizedText': {
        const raw = (supportedLangs?.length ? supportedLangs : itemField.langs) ?? [DEFAULT_LANG];
        const locales = raw.length ? raw : [DEFAULT_LANG];
        const obj: Record<string, string> =
          typeof fieldValue === 'string'
            ? { [DEFAULT_LANG]: fieldValue }
            : fieldValue != null && typeof fieldValue === 'object' && !Array.isArray(fieldValue)
              ? { ...(fieldValue as Record<string, string>) }
              : {};
        if (localizedTextView === 'stacked') {
          return (
            <LocalizedTextStackedItemField
              placeholder={itemField.placeholder}
              obj={obj}
              locales={locales}
              onUpdate={(v) => updateItem(itemIndex, itemField.name, v)}
            />
          );
        }
        if (localizedTextView === 'dropdown') {
          return (
            <LocalizedTextDropdownItemField
              placeholder={itemField.placeholder}
              obj={obj}
              locales={locales}
              onUpdate={(v) => updateItem(itemIndex, itemField.name, v)}
            />
          );
        }
        return (
          <LocalizedTextTabbedField
            fieldName={itemField.name}
            placeholder={itemField.placeholder}
            obj={obj}
            locales={locales}
            onUpdate={(v) => updateItem(itemIndex, itemField.name, v)}
          />
        );
      }
      default:
        return (
          <Input
            value={(fieldValue as string) || ''}
            onChange={(event) => updateItem(itemIndex, itemField.name, event.target.value)}
            className="h-8 text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Bulk expand/collapse */}
      {items.length > 1 && (
        <div className="flex gap-1 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={() => setOpenIndices(new Set(items.map((_, i) => i)))}
          >
            <ChevronsUpDown className="w-3 h-3" /> Expand all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={() => setOpenIndices(new Set())}
          >
            <ChevronsDownUp className="w-3 h-3" /> Collapse all
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => {
            const itemId = (item.id as string) || `fallback-${index}`;
            return (
              <SortableItem key={itemId} id={itemId}>
                {(dragHandleProps) => (
                  <Collapsible
                    open={openIndices.has(index)}
                    onOpenChange={() => toggleOpen(index)}
                  >
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center">
                        {/* Drag handle */}
                        <div
                          {...dragHandleProps}
                          className="px-2 py-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <CollapsibleTrigger className="flex-1 flex items-center justify-between px-2 py-2 bg-muted/50 hover:bg-muted transition-colors gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {schema.length > 0 ? (
                              openIndices.has(index) ? (
                                <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                              )
                            ) : null}
                            <span className="text-sm font-medium truncate">
                              {getItemLabel(item.label) ||
                                getItemLabel(item.title) ||
                                getItemLabel(item.platform) ||
                                getItemLabel(item.name) ||
                                getItemLabel(item.locationName) ||
                                getItemLabel(item.question) ||
                                `Item ${index + 1}`}
                            </span>
                          </div>
                        </CollapsibleTrigger>

                        {/* Duplicate */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateItem(index);
                          }}
                          title="Duplicate item"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(index);
                          }}
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <CollapsibleContent>
                        <div className="p-3 space-y-3">
                          {schema.map((schemaField) => (
                            <div key={schemaField.name} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{schemaField.label}</Label>
                              {renderItemField(schemaField, item, index)}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>

      <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-3 h-3 mr-2" />
        Add Item
      </Button>
    </div>
  );
};
