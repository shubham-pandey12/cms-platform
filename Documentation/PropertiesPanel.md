# Properties Panel — Widget Schema v2 Reference

The Properties Panel is the right-hand sidebar in the CMS page builder. It renders configurable inputs for the currently selected widget, driven entirely by the widget's `configSchema` declaration.

---

## Table of Contents

1. [Schema v2 shape](#schema-v2-shape)
2. [Field types](#field-types)
3. [Conditional visibility and disabling](#conditional-visibility-and-disabling)
4. [Field groups](#field-groups)
5. [Tab configuration](#tab-configuration)
6. [Responsive styles](#responsive-styles)
7. [Element styles (per-element CSS)](#element-styles)
8. [Plugin API — custom field renderers](#plugin-api)
9. [Migration from v1](#migration-from-v1)

---

## Schema v2 shape

```typescript
interface WidgetConfigSchema {
  fields: WidgetConfigField[];
  styleableElements?: StyleableElement[];
  groups?: Array<{ key: string; label: string; defaultOpen?: boolean; order?: number }>;
  tabs?: Array<{ key: string; label: string; when?: Condition }>;
}
```

### `groups`

Declare named collapsible sections. Fields reference a group via `field.group`:

```json
{
  "groups": [
    { "key": "content", "label": "Content", "defaultOpen": true, "order": 1 },
    { "key": "advanced", "label": "Advanced Options", "defaultOpen": false, "order": 2 }
  ],
  "fields": [
    { "name": "title", "label": "Title", "type": "text", "required": true, "group": "content" },
    { "name": "itemLimit", "label": "Item limit", "type": "number", "required": false, "group": "advanced" }
  ]
}
```

### `tabs`

Override which tabs appear in the panel. Useful for widgets that only have content settings (hide Style/Bindings/Actions/Visibility):

```json
{
  "tabs": [
    { "key": "content", "label": "Content" },
    { "key": "style", "label": "Style" }
  ]
}
```

A `when` condition on a tab hides it when the condition is false. See [Conditions](#conditional-visibility-and-disabling).

---

## Field types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `richtext` | WYSIWYG HTML editor (TipTap) — supports bold, italic, lists, links |
| `number` | Numeric input; respects `validation.min` / `validation.max` |
| `toggle` | Boolean switch |
| `select` | Dropdown; requires `options: [{label, value}]` |
| `color` | Native colour picker + hex input |
| `themeColor` | Theme-token picker (primary/secondary/accent/…) with custom hex fallback; value: `{token?, value}` |
| `media` | Image URL + media library browser |
| `iconPicker` | Searchable lucide-react icon grid; value: icon name string |
| `linkPicker` | External URL / internal CMS page / anchor tabs; value: `{href, target, rel}` |
| `dimension` | Top/Right/Bottom/Left composite with unit selector (px/rem/%); value: CSS shorthand string |
| `gradient` | Linear/radial gradient builder; value: `{type, angle, stops[]}` |
| `json` | JSON editor (textarea with parse-on-change); value: parsed object or raw string |
| `code` | Code textarea with monospaced font |
| `dateTime` | Native datetime-local input |
| `range` | Slider; respects `validation.min` / `validation.max`; use `type: "range"` instead of `"number"` when a slider is preferable |
| `data-binding` | Data source selector, dynamically populated from page API calls; hardcoded sources via `dataBindingSources` |
| `array` | List of complex items; requires `arrayItemSchema` |
| `localizedText` | Multi-language text input (tabbed/stacked/dropdown); respects `langs` |

### Inline validation

Every field renderer reads `field.validation` and shows an error message below the input:

```json
{
  "name": "promoCode",
  "label": "Promo code",
  "type": "text",
  "required": false,
  "validation": {
    "min": 4,
    "max": 12,
    "pattern": "^[A-Z0-9]+$",
    "message": "Must be 4–12 uppercase letters/digits."
  }
}
```

### Field-level metadata

| Key | Purpose |
|-----|---------|
| `group` | Assigns field to a collapsible group |
| `order` | Explicit rendering order (within group) |
| `tab` | Which tab this field belongs to (`content`, `style`, or a custom key) |
| `unit` | Default CSS unit for `dimension`/`number` fields (`px`, `rem`, `%`) |
| `component` | Custom renderer key registered via plugin API |
| `helpText` | Tooltip shown next to the field label |
| `hiddenIfFieldHasValue` | Shorthand: hide when the named sibling has a non-empty value |
| `visibleWhen` | Conditional visibility (full Condition tree) |
| `disabledWhen` | Conditional disabled state |
| `dataBindingSources` | Restrict data-binding options to these API call IDs |

---

## Conditional visibility and disabling

Fields support a declarative condition engine. Conditions are evaluated against the live widget config object.

### Simple condition

```json
{
  "field": "showAdvanced",
  "op": "truthy"
}
```

### Compound condition

```json
{
  "all": [
    { "field": "mode", "op": "eq", "value": "api" },
    { "field": "apiEndpoint", "op": "truthy" }
  ]
}
```

### Operators

| Operator | Description |
|----------|-------------|
| `truthy` | Field has a non-empty value |
| `falsy` | Field has an empty/null/false value |
| `eq` | Strictly equal to `value` |
| `neq` | Not equal to `value` |
| `in` | Value is in the `value` array |
| `nin` | Value is not in the `value` array |
| `gt` | Numeric greater than |
| `lt` | Numeric less than |
| `regex` | String matches regexp pattern in `value` |

Custom operators can be registered via `widgetPropertyRegistry.registerConditionOperator`.

### Quick shorthand

```json
{ "name": "items", "label": "Items", "type": "array", "hiddenIfFieldHasValue": "apiEndpoint" }
```

---

## Field groups

Group fields into collapsible sections by declaring `schema.groups` and setting `field.group`:

```json
{
  "groups": [
    { "key": "content", "label": "Content", "defaultOpen": true },
    { "key": "seo", "label": "SEO", "defaultOpen": false }
  ],
  "fields": [
    { "name": "title", "group": "content", ... },
    { "name": "metaDescription", "group": "seo", ... }
  ]
}
```

Undeclared group keys render automatically as collapsible sections using the key as the label.

---

## Tab configuration

By default the panel shows: **Content | Style | Bindings | Actions | Visibility**.

To override, add `schema.tabs`:

```json
{
  "tabs": [
    { "key": "content", "label": "Content" },
    {
      "key": "style",
      "label": "Style",
      "when": { "field": "enableCustomStyles", "op": "truthy" }
    }
  ]
}
```

Tabs whose `when` condition is false are hidden.

---

## Responsive styles

`WidgetStyles` fields (`padding`, `margin`, `shadow`) now accept responsive values:

```typescript
// Flat (same on all breakpoints)
{ padding: 'md' }

// Per-breakpoint
{ padding: { mobile: 'sm', tablet: 'md', desktop: 'lg' } }
```

The Style tab shows a **breakpoint toggle** (All / Mobile / Tablet / Desktop) at the top. The selected breakpoint determines which tier of the responsive object is read and written.

---

## Element styles

Declare `styleableElements` in the schema to expose per-element CSS overrides:

```json
{
  "styleableElements": [
    {
      "name": "title",
      "label": "Title text",
      "allowedProperties": ["color", "fontSize", "fontWeight", "letterSpacing"]
    },
    {
      "name": "card",
      "label": "Card container",
      "allowedProperties": ["backgroundColor", "borderRadius", "padding", "border"]
    }
  ]
}
```

`allowedProperties` controls which editors appear in the collapsible section. If omitted, all 11 properties are shown.

Element style values are stored in `config.elementStyles[elementName][cssProp]` and consumed by the widget renderer.

---

## Plugin API

Widget packages can register custom field renderers and condition operators without modifying core CMS files.

### 1. Create `properties.ts` alongside the widget version

```typescript
// widgets/acme/widget-fancy-card/v1/properties.ts
import { widgetPropertyRegistry } from '@/lib/widgetPropertyRegistry';
import { BrandColorPicker } from './BrandColorPicker';

widgetPropertyRegistry.registerFieldRenderer('acme.brandColor', BrandColorPicker);
```

`BrandColorPicker` must accept `WidgetFieldRendererProps`.

### 2. Reference the renderer in the widget schema

```json
{
  "name": "brandColor",
  "label": "Brand Color",
  "type": "color",
  "component": "acme.brandColor"
}
```

`WidgetFieldRenderer` checks the registry first (via `field.component`) before falling back to the built-in switch.

### Custom condition operators

```typescript
widgetPropertyRegistry.registerConditionOperator('startsWith', (lhs, rhs) => {
  return typeof lhs === 'string' && typeof rhs === 'string' && lhs.startsWith(rhs);
});
```

Use in schema:

```json
{ "field": "slug", "op": "startsWith", "value": "acme-" }
```

---

## Migration from v1

Existing widgets continue to work without modification — all schema additions are optional.

The legacy `shouldHideField` behaviour (hiding `packages`, `images`, `features`, `slides`, `questions` when `apiEndpoint` has a value) is now expressed as `visibleWhen` conditions. For backward compatibility the derivation still runs automatically for fields that don't declare `visibleWhen` or `hiddenIfFieldHasValue`.

To migrate a widget explicitly:

```json
// Before (v1 — implicit hiding via shouldHideField)
{ "name": "packages", "type": "array", ... }

// After (v2 — explicit)
{ "name": "packages", "type": "array", "hiddenIfFieldHasValue": "apiEndpoint", ... }
```

A codemod script is available at `scripts/migrate-widget-schemas.ts` for bulk updates.
