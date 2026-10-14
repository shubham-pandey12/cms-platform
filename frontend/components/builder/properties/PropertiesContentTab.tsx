'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Info, RotateCcw, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { evaluateCondition } from '@/lib/widgetSchema/evaluateCondition';
import { WidgetFieldRenderer } from './WidgetFieldRenderer';
import type {
  LocalizedTextViewMode,
  PropertiesContentTabProps,
  WidgetConfigRecord,
} from './types';
import { LOCALIZED_TEXT_VIEW_STORAGE_KEY } from './types';
import type { Condition, WidgetConfigField } from '@/types/cms';

/** Derive the legacy shouldHideField behaviour as a Condition for fields that don't yet
 *  declare `visibleWhen` / `hiddenIfFieldHasValue` in their schema. */
function deriveLegacyVisibility(field: WidgetConfigField): Condition | undefined {
  const legacyApiBackedFields = new Set(['packages', 'images', 'features', 'slides', 'questions']);

  if (legacyApiBackedFields.has(field.name)) {
    return { field: 'apiEndpoint', op: 'falsy' };
  }
  if (field.name === 'holidayTypes') {
    return { field: 'holidayTypesApiEndpoint', op: 'falsy' };
  }
  if (field.name === 'destinations' || field.name === 'destinationsItems') {
    return { field: 'destinationsApiEndpoint', op: 'falsy' };
  }
  if (field.name === 'importantLinks') {
    return { field: 'importantLinksApiEndpoint', op: 'falsy' };
  }
  if (field.name === 'holidayTypesItems') {
    return { field: 'holidayTypesApiEndpoint', op: 'falsy' };
  }
  return undefined;
}

/** Resolve the effective visibility condition for a field, preferring explicit schema declarations. */
function resolveVisibility(field: WidgetConfigField): Condition | undefined {
  if (field.visibleWhen) return field.visibleWhen;

  if (field.hiddenIfFieldHasValue) {
    return { field: field.hiddenIfFieldHasValue, op: 'falsy' };
  }

  return deriveLegacyVisibility(field);
}

function isFieldVisible(field: WidgetConfigField, config: WidgetConfigRecord): boolean {
  const condition = resolveVisibility(field);
  if (!condition) return true;
  return evaluateCondition(condition, config);
}

function isFieldDisabled(field: WidgetConfigField, config: WidgetConfigRecord): boolean {
  if (!field.disabledWhen) return false;
  return evaluateCondition(field.disabledWhen, config);
}

function hasLocalizedTextInSchema(fields: WidgetConfigField[]): boolean {
  for (const f of fields) {
    if (f.type === 'localizedText') return true;
    if (f.type === 'array' && f.arrayItemSchema?.some((sf) => sf.type === 'localizedText')) return true;
  }
  return false;
}

function readStoredLocalizedTextView(): LocalizedTextViewMode {
  if (typeof window === 'undefined') return 'tabbed';
  const raw = window.localStorage.getItem(LOCALIZED_TEXT_VIEW_STORAGE_KEY);
  if (raw === 'tabbed' || raw === 'stacked' || raw === 'dropdown') return raw;
  return 'tabbed';
}

// ---- Field group rendering ----

interface FieldGroupProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FieldGroup({ label, defaultOpen = true, children }: FieldGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1 text-sm font-semibold text-foreground hover:text-primary transition-colors">
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 ml-2 space-y-5 border-l border-border pl-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---- Single field row ----

interface FieldRowProps {
  field: WidgetConfigField;
  config: WidgetConfigRecord;
  defaultConfig?: Record<string, unknown>;
  onConfigChange: (name: string, value: unknown) => void;
  onOpenMediaLibrary: (name: string) => void;
  supportedLangs?: string[];
  localizedTextView?: LocalizedTextViewMode;
  apiCalls?: import('@/types/cms').ApiCall[];
}

function FieldRow({
  field,
  config,
  defaultConfig,
  onConfigChange,
  onOpenMediaLibrary,
  supportedLangs,
  localizedTextView,
  apiCalls,
}: FieldRowProps) {
  const disabled = isFieldDisabled(field, config);
  const isDirty =
    defaultConfig !== undefined &&
    JSON.stringify(config[field.name]) !== JSON.stringify(defaultConfig[field.name]);

  return (
    <div key={field.name} className="space-y-2">
      <Label
        htmlFor={field.name}
        className="text-sm font-medium text-foreground flex items-center gap-2"
      >
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
        {field.helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{field.helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isDirty && defaultConfig && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onConfigChange(field.name, defaultConfig[field.name])}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Reset to default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>

      <div className={disabled ? 'pointer-events-none opacity-50' : undefined}>
        <WidgetFieldRenderer
          field={field}
          value={config[field.name]}
          onConfigChange={onConfigChange}
          onOpenMediaLibrary={onOpenMediaLibrary}
          supportedLangs={supportedLangs}
          localizedTextView={localizedTextView}
          apiCalls={apiCalls}
        />
      </div>
    </div>
  );
}

// ---- Main component ----

export const PropertiesContentTab: React.FC<PropertiesContentTabProps> = ({
  widgetDef,
  config,
  onConfigChange,
  onOpenMediaLibrary,
  supportedLangs,
  dynamicVariables = [],
  fieldSearch = '',
  defaultConfig,
  apiCalls,
}) => {
  const schema = widgetDef.configSchema;

  const hasLocalizedText = useMemo(
    () => hasLocalizedTextInSchema(schema.fields),
    [schema.fields]
  );

  const [localizedTextView, setLocalizedTextViewState] = useState<LocalizedTextViewMode>(
    () => readStoredLocalizedTextView()
  );
  const setLocalizedTextView = useCallback((mode: LocalizedTextViewMode) => {
    setLocalizedTextViewState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALIZED_TEXT_VIEW_STORAGE_KEY, mode);
    }
  }, []);

  // Content-tab fields only (tab === 'content' or unset), visible in current config state
  const contentFields = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase();
    return schema.fields
      .filter((f) => !f.tab || f.tab === 'content')
      .filter((f) => isFieldVisible(f, config))
      .filter((f) => {
        if (!q) return true;
        return (
          f.name.toLowerCase().includes(q) ||
          f.label.toLowerCase().includes(q) ||
          (f.helpText?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [schema.fields, config, fieldSearch]);

  // Group fields by their declared group key, preserving schema group order
  const ungroupedFields = contentFields.filter((f) => !f.group);
  const groupedFields = useMemo<Map<string, WidgetConfigField[]>>(() => {
    const map = new Map<string, WidgetConfigField[]>();
    for (const f of contentFields) {
      if (!f.group) continue;
      const existing = map.get(f.group) ?? [];
      existing.push(f);
      map.set(f.group, existing);
    }
    return map;
  }, [contentFields]);

  // Ordered group definitions from schema, with fallback for undeclared keys
  const groupDefs = useMemo(() => {
    const declared = schema.groups ?? [];
    const declaredKeys = new Set(declared.map((g) => g.key));
    const extra: typeof declared = [];
    for (const key of groupedFields.keys()) {
      if (!declaredKeys.has(key)) {
        extra.push({ key, label: key, defaultOpen: true });
      }
    }
    return [...declared, ...extra].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [schema.groups, groupedFields]);

  const hasApiEndpoint =
    typeof config.apiEndpoint === 'string' && config.apiEndpoint.trim().length > 0;

  const sharedFieldProps = {
    config,
    defaultConfig,
    onConfigChange,
    onOpenMediaLibrary,
    supportedLangs,
    localizedTextView: hasLocalizedText ? localizedTextView : undefined,
    apiCalls,
  };

  return (
    <TabsContent value="content" className="flex-1 overflow-hidden mt-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-5">
          {/* Language view selector */}
          {hasLocalizedText && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Language fields view</Label>
              <Select
                value={localizedTextView}
                onValueChange={(v) => setLocalizedTextView(v as LocalizedTextViewMode)}
              >
                <SelectTrigger className="h-9 w-full max-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabbed">Tabbed</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="stacked">Stacked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Empty search state */}
          {fieldSearch && contentFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fields match &quot;{fieldSearch}&quot;.
            </p>
          )}

          {/* Ungrouped fields */}
          {ungroupedFields.map((field) => (
            <FieldRow key={field.name} field={field} {...sharedFieldProps} />
          ))}

          {/* Grouped fields */}
          {groupDefs.map((groupDef) => {
            const fields = groupedFields.get(groupDef.key);
            if (!fields || fields.length === 0) return null;
            return (
              <FieldGroup
                key={groupDef.key}
                label={groupDef.label}
                defaultOpen={groupDef.defaultOpen !== false}
              >
                {fields.map((field) => (
                  <FieldRow key={field.name} field={field} {...sharedFieldProps} />
                ))}
              </FieldGroup>
            );
          })}

          {/* Auto-pass dynamic URL params — shown only on dynamic pages when apiEndpoint is set */}
          {dynamicVariables.length > 0 && hasApiEndpoint && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  Pass URL params to API
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          When enabled, dynamic URL variables from the page path (e.g. SUMMER from
                          /holidays/&lt;SUMMER&gt;) are automatically appended as query params to
                          the API endpoint. You can optionally rename them below.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch
                  checked={Boolean(config.autoPassRouteParams)}
                  onCheckedChange={(checked) => onConfigChange('autoPassRouteParams', checked)}
                />
              </div>

              {Boolean(config.autoPassRouteParams) && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Optionally map URL variable names to different query param names:
                  </p>
                  {dynamicVariables.map((varName) => {
                    const paramMap = (config.routeParamMap as Record<string, string>) ?? {};
                    const mappedKey = paramMap[varName] ?? '';
                    return (
                      <div key={varName} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">
                          &lt;{varName}&gt;
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">→</span>
                        <Input
                          value={mappedKey}
                          onChange={(e) => {
                            const next = { ...(config.routeParamMap as Record<string, string> ?? {}) };
                            if (e.target.value.trim()) {
                              next[varName] = e.target.value.trim();
                            } else {
                              delete next[varName];
                            }
                            onConfigChange('routeParamMap', Object.keys(next).length > 0 ? next : undefined);
                          }}
                          placeholder={varName}
                          className="h-7 text-xs flex-1 font-mono"
                        />
                        {mappedKey && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...(config.routeParamMap as Record<string, string> ?? {}) };
                              delete next[varName];
                              onConfigChange('routeParamMap', Object.keys(next).length > 0 ? next : undefined);
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            aria-label={`Clear mapping for ${varName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use the original name (e.g. <span className="font-mono">?SUMMER=summer</span>).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </TabsContent>
  );
};
