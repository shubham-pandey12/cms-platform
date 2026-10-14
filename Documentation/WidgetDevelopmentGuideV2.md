# CMS Widget Development Guide  
Audience: Engineers building widgets
Goal: Get a widget live with minimal context
Non-goal: Explaining how the system works internally

**See also:** [Widget System Overview](./WidgetSystemOverview.md) (end-to-end flow), [High-Level Design](./HighLevelDesign.md) (architecture), [widget-html-embed](./widget-html-embed.md) (external SSR fragment API).

## Definitions  
- Default Config - A widgets default configuration for example a toggle for header stickiness.
- Instance Config - A widgets configuration, set by an editor after placing the widget on the page.  

## 1. Running the Application 

For any of the following steps, the application should open in the browser automatically. If it doesn't, check the logs, you should see a line starting with `Login to the dashboard at ...`

### 1.1 Running from Docker  (PREFERRED)
- From the root directory, run `docker compose -f docker-compose.yaml --env-file .env.Development up -d`
### 1.2 Running from Aspire  
- From the project root, run `dotnet run --project orchestration/Cms.AppHost/Cms.AppHost.csproj`  
### 1.3 Running from an IDE
- Most IDEs can run the AppHost project directly from the solution.


## 2.  Mental Model  
A widget is comprised of 2 parts:  

- Backend: `WidgetDefinition` + `WidgetDefinitionVersion`  
Defines the schema, defaults, and metadata. Widgets support **versioning** — each version has its own schema, defaults, and changelog.

- Frontend: `CustomRenderer`  
A React component that renders the widget onto a page. Each version can have its own renderer.  

## 3. What CMS handles for you  
When your CustomRenderer runs, the platform has already:
- Merged DefaultConfig + instance.config

- Merged DefaultStyles + instance.styles

- Resolved the active brand theme

- Determined preview vs published mode

- Passed the current language (`lang`) for i18n; use `getLocalizedValue(config.xyz, lang)` for any localized config field (see [I18n.md](./I18n.md)).

## 4. Required Files (folder-based)

Widgets live under the repo-level **`widgets/`** folder. The system supports two structures:

### 4.1 Versioned Widgets (Recommended)

Use version subfolders for widgets that may evolve over time:

```
widgets/widget-button/
  v1/
    Definition.cs    # IWidgetVersionProvider
    index.tsx
  v2/
    Definition.cs    # IWidgetVersionProvider
    index.tsx
```

- **Frontend:** `index.tsx` in the version folder — default export must be a `CustomRenderer`.
- **Backend:** `Definition.cs` implementing `IWidgetVersionProvider` that returns a `WidgetVersionInfo`.

You may nest widgets under a brand folder: `widgets/<brand>/widget-<slug>/v1/` (same files as above). The `Slug` in `Definition.cs` remains `widget-<slug>` (no brand prefix).

### 4.2 Legacy Single-Version Widgets

For simple widgets without versioning needs:

```
widgets/widget-hello/
  Definition.cs      # IWidgetDefinitionProvider
  index.tsx
```

- **Frontend:** `index.tsx` — default export must be a `CustomRenderer`.
- **Backend:** `Definition.cs` implementing `IWidgetDefinitionProvider` that returns a `WidgetDefinition`.

### Common Rules

- No manual registry needed; the frontend loads renderers from `widgets/` at build time.
- The seeder discovers definitions at startup. You do not edit `DatabaseSeeder.cs`.
- Optional: `Controller.cs` for widget-specific API endpoints (see `widgets/README.md`).
- Slug format: `widget-` + kebab-case; the slug must match the **widget** folder name (`widget-*`) and the `Slug` property (ignore an optional parent brand folder).  

## 5. Quickstart Widget Development

### 5.1 Hello World Versioned Widget (Recommended)
**Goal**: Create a versioned widget with minimal configuration.

**1. Create the folder structure:** `widgets/widget-hello-world/v1/`

**2. Backend:** Add `widgets/widget-hello-world/v1/Definition.cs` implementing `IWidgetVersionProvider`:

```csharp
using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.HelloWorld.V1;

public sealed class HelloWorldV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-hello-world";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var configSchema = JsonSerializer.Serialize(new
        {
            fields = new object[]
            {
                new { name = "message", label = "Message", type = "text", required = true }
            }
        }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(new { message = "Hello, World!" }, JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
            Name: "Hello World",
            Description: "A simple greeting widget",
            Category: WidgetCategory.Content,
            Icon: "hand-wave",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: new WidgetStyles { Padding = "md" },
            ChangeLog: null
        );
    }
}
```

**3. Frontend:** Add `widgets/widget-hello-world/v1/index.tsx`:

```tsx
'use client';

import React from 'react';
import type { CustomRenderer } from '@/types/renderTemplate';

const HelloWorldRenderer: CustomRenderer = ({ config }) => (
  <div>{(config?.message as string) || "Hello World"}</div>
);

export default HelloWorldRenderer;
```

**4. Validate, build and run:** Run `npm run widget:validate` to verify contracts. Then run `npm run dev` or `npm run build` and start the backend. You should see the widget in the library.

**Scaffold (optional):** From the `frontend/` directory, run `npm run widget:create <slug>` (e.g. `npm run widget:create hello-world`) to scaffold files. The scaffold runs validation automatically.

### 5.1b Legacy Hello World (Single-Version)
For simple widgets that won't need versioning, you can use the legacy pattern with `IWidgetDefinitionProvider`. See `widgets/README.md` for the legacy structure.

### 5.2 Adding optional configuration fields  
**Goal:** Extend the §5.1 widget with a `showIcon` toggle alongside `message`.

**Backend:** In `GetVersionInfo()`, replace the `configSchema` and `defaultConfig` assignments (and pass them into `WidgetVersionInfo` as before):

```csharp
var configSchema = JsonSerializer.Serialize(new
{
    fields = new object[]
    {
        new { name = "message", label = "Message", type = "text", required = true },
        new { name = "showIcon", label = "Show Icon", type = "toggle", required = false },
    }
}, JsonOptions);

var defaultConfig = JsonSerializer.Serialize(new
{
    message = "Hello, World!",
    showIcon = true,
}, JsonOptions);
```

**Frontend:** Use the new fields in `index.tsx`:

```tsx
const HelloWorldRenderer: CustomRenderer = ({ config }) => {
  const message = (config?.message as string) || 'Hello World';
  const showIcon = config?.showIcon !== false;
  return (
    <div>
      {showIcon ? <span aria-hidden>👋 </span> : null}
      {message}
    </div>
  );
};
```

Editors can change the message and toggle the icon from the properties panel.

### 5.3 Widget schema style guide

The Properties Panel renders the **Content** tab from `configSchema.fields` only. Use this style guide so new widgets work without touching `PropertiesPanel.tsx`.

### Safe Properties Panel Checklist

- [ ] Use only supported field types: `text`, `textarea`, `richtext`, `number`, `toggle`, `select`, `color`, `media`, `data-binding`, `array`, `localizedText` (optional `langs` for locale codes).
- [ ] For `select`, provide `options`; for `array`, provide `arrayItemSchema` and default to `[]`.
- [ ] Keep `defaultConfig` aligned with field types (e.g. `number` → number, `toggle` → boolean).
- [ ] Use unique, stable field `name`s (avoid renaming after content exists).
- [ ] Run `npm run widget:validate` and verify in the builder (Content tab, Style tab, preview).

### Reserved / Behavioral Names (avoid unless intentional)

These field names trigger special behavior in the panel; avoid them for generic widgets:

| Field name | Behavior |
|------------|----------|
| `packages`, `images`, `features`, `slides`, `questions` | Hidden when `apiEndpoint` is set |
| `holidayTypes` | Hidden when `holidayTypesApiEndpoint` is set |
| `destinations`, `destinationsItems` | Hidden when `destinationsApiEndpoint` is set |
| `importantLinks` | Hidden when `importantLinksApiEndpoint` is set |
| `holidayTypesItems` | Hidden when `holidayTypesApiEndpoint` is set |
| `items` | May trigger generic "Items Per Page" injection if no `pageSize` in schema |
| `elementStyles` | Used by Style tab for styleable elements; don’t reuse for custom data |

**Pagination:** If the widget has array data, include `pageSize` in the schema so the panel does not auto-inject a generic pagination control.

**Actions:** Use the **Actions** tab (ActionEditor) for click/navigation; do not rely on a config field of type `action` (it falls back to a text input).

### Localized text (i18n)

For user-facing text that should vary by language, use field type **`localizedText`**. You can optionally set **`langs`** (e.g. `["en-GB", "fr-FR"]`) in the schema; the builder will show one input per locale (tabs, stacked, or dropdown). The list of locales shown comes from Site Settings **Supported languages** when set, otherwise from `field.langs`, then the default locale (e.g. en-GB). In the renderer, use `getLocalizedValue(config.fieldName, lang)` so the correct translation is shown on published pages based on `?lang=`. See [I18n.md](./I18n.md) for full behavior (viewer lang, resolving values, key files).

### Recommended Naming Convention (collision-safe)

- **Prefix:** Derive a short prefix from the widget slug and use it for all business fields. Example: `widget-faq-accordion` → prefix `faq` → `faqHeading`, `faqEntries`, `faqCtaLabel`.
- **Pattern:** `<prefix><Subject><Type>` in camelCase. Examples: `faqHeadingText`, `faqCardList`, `faqApiEndpoint`, `faqEmptyStateMessage`.
- **Booleans:** Use `is` / `has` / `show` / `enable`. Examples: `showFaqIcon`, `enableFaqSearch`.
- **Arrays:** Use explicit names (e.g. `faqEntries`, `featureCards`, `galleryAssets`), not generic `items`.
- **API keys:** Prefer namespaced keys (e.g. `faqApiEndpoint`) unless you intentionally want the global `apiEndpoint` hide logic.

### Example: collision-safe ConfigSchema (C#)

```csharp
ConfigSchema = JsonSerializer.Serialize(new
{
    fields = new object[]
    {
        new { name = "faqHeading", label = "Heading", type = "text", required = true },
        new { name = "faqEntries", label = "FAQ Entries", type = "array", required = false, arrayItemSchema = new object[]
            {
                new { name = "question", label = "Question", type = "text", required = true },
                new { name = "answer", label = "Answer", type = "textarea", required = true }
            }
        },
        new { name = "faqApiEndpoint", label = "API Endpoint", type = "text", required = false },
        new { name = "pageSize", label = "Items Per Page", type = "number", required = false, defaultValue = 6 },
        new { name = "showFaqIcon", label = "Show Icon", type = "toggle", required = false, defaultValue = true }
    }
}, JsonOptions),
DefaultConfig = JsonSerializer.Serialize(new
{
    faqHeading = "Frequently Asked Questions",
    faqEntries = Array.Empty<object>(),
    faqApiEndpoint = "",
    pageSize = 6,
    showFaqIcon = true
}, JsonOptions),
```

### 5.4 Creating a new widget version

**Goal**: Add a v2 to an existing widget with new features.

When you need to make breaking changes or significant enhancements to a widget, create a new version rather than modifying the existing one. This preserves backward compatibility for existing widget instances.

**1. Create the version folder:** `widgets/widget-hello-world/v2/`

**2. Copy and modify files:** Copy `Definition.cs` and `index.tsx` from `v1/` to `v2/` and update:

**Definition.cs changes:**
- Update namespace: `Cms.Widgets.HelloWorld.V2`
- Update class name: `HelloWorldV2Definition`
- Update `Version`: `"2.0.0"`
- Generate a **new unique GUID** for the `Id`
- Add `ChangeLog` describing what changed

```csharp
public string Version => "2.0.0";

public WidgetVersionInfo GetVersionInfo()
{
    // ... updated schema with new fields ...
    
    return new WidgetVersionInfo(
        Id: Guid.Parse("b2c3d4e5-f6a7-8901-bcde-f23456789012"), // NEW GUID
        Name: "Hello World",
        Description: "Enhanced greeting widget with icon support",
        // ... other properties ...
        ChangeLog: "Added icon support and greeting variants"
    );
}
```

**3. Update the frontend renderer:** Modify `index.tsx` in `v2/` to support the new features.

**4. Validate:** Run `npm run widget:validate` to ensure both versions are valid.

**Key Rules for Versioning:**
- Each version must have a **unique GUID** — never reuse IDs across versions
- The `Slug` must remain the same across all versions
- Use semantic versioning: `major.minor.patch`
- Always provide a `ChangeLog` for versions after v1
- The system automatically marks the highest version as "latest"

### 5.5 Widgets that fetch from an API and need SSR

If your widget has config fields like `apiEndpoint` (or multiple endpoint fields) and fetches data in `useEffect` via `fetchWidgetJson`, the **published page** can pre-fill that data on the server so the first HTML already contains it (and it works without JavaScript).

**Step:** Add `widgets/widget-<slug>/v<n>/ssrEndpoints.ts` with `export const endpointSsrMapping = { ... }`. Use a single-endpoint or multi-endpoint shape; see [widgets/README.md](../widgets/README.md) for the exact shape.

**Optional responseArrayKeys:** When your API returns the array under a key that is not the same as your widget config key (e.g. API returns `{ links: [...] }` but your widget expects `holidayTypes`), set `responseArrayKeys: ['links', 'items']` so the server knows which keys to try. Without it, the server uses `responseKey` first, then the first array property in the response.

**API priority:** When an endpoint URL is set, the widget always fetches from that API (builder and published). Changing the URL in the builder triggers a re-fetch; on the published page, server-filled data is used for first paint, then the client fetch overwrites with fresh API data when JavaScript runs.

### 5.6 HTML embed for external sites (optional)

This is **not** the same as `ssrEndpoints.ts`: embed is for **other** sites that want a server-rendered HTML fragment of one **body** widget instance (`GET /api/embed/widget`).

1. **Backend:** In `GetVersionInfo()`, pass `SupportsHtmlEmbed: true` as the last argument to `WidgetVersionInfo`. The seeder persists it on the definition row (API JSON uses camelCase `supportsHtmlEmbed`).
2. **Frontend:** Add a slug entry in `frontend/lib/embed/embedRenderers.tsx` so `getEmbedRenderer` returns a component that renders static-friendly markup (use the same config/style merging assumptions as the interactive widget where possible).
3. **Database:** After changing the flag, apply migrations or let the seeder refresh definitions in your environment as you normally do for schema/metadata changes.

Full API, auth, status codes, builder **Copy embed link**, and host `fetch` examples: [widget-html-embed.md](./widget-html-embed.md).

## 6. Testing  

### Widget Library
- [ ] Widget appears in the correct category in the widget library
- [ ] Icon displays correctly
- [ ] Name and description are clear

### Configuration Panel
- [ ] All config fields appear in Properties Panel when widget is selected
- [ ] Default values are applied correctly
- [ ] Required field validation works
- [ ] Select dropdowns show all options
- [ ] Media picker opens media library
- [ ] Array fields allow add/remove items

### Rendering
- [ ] Widget renders correctly on canvas
- [ ] Preview mode shows final appearance
- [ ] All config options affect rendering
- [ ] Widget handles missing/empty config gracefully

### Styling
- [ ] Background color applies correctly
- [ ] Text color applies correctly
- [ ] Padding presets work
- [ ] Border radius applies
- [ ] Shadow presets work
- [ ] Opacity slider works

### Theme Integration
- [ ] Widget respects theme colors
- [ ] Widget uses theme fonts
- [ ] Widget looks good with different themes

### Responsive Design
- [ ] Desktop viewport displays correctly
- [ ] Tablet viewport displays correctly
- [ ] Mobile viewport displays correctly

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces content properly
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA

### Preview page layout (overflow and text)

To avoid horizontal overflow and text clipping on the **preview / published page**:

1. **Avoid `w-screen` (100vw) for full-width elements.**  
   `100vw` includes the scrollbar width, so the page can become wider than the viewport and show a white strip on the right with the scrollbar overlapping content. For full-width panels (e.g. mega menus, dropdowns), use `left-0 right-0 w-full` (or `inset-x-0 w-full`) so the element spans the parent width instead of the viewport.

2. **Single-line labels (e.g. price pills).**  
   If a compact box (e.g. a white “price pill”) shows a single line of text (e.g. “3.63 3 from £2,264”), prevent wrapping and clipping: add `whitespace-nowrap` on the text element and `overflow-visible min-w-fit` on the wrapper so the line stays on one line and the box does not clip.

## 7. Debugging  
- Check the network tab for any failed requests.
- Check the browser developer tools for any console errors.
- Check Docker/IDE logs for any errors in the Backend.

### 7.1 Common Issues
- **Docker error of port already in use**: 
  - run `docker ps` check what port CMS is trying to use. 
  - run `docker compose down --kill-orphans`
  - check network for what's using the same port.
  - Either kill the process using the same port, or change the port in `docker-compose.yaml`
  - Don't push your docker changes!!
  - Restart the app: `docker compose -f docker-compose.yaml --env-file .env.Development up -d` (or the env file you use)
- **Widget not appearing in library**:
  - Ensure the widget folder exists under `widgets/widget-<slug>/` or `widgets/<brand>/widget-<slug>/` with both `index.tsx` and `Definition.cs` (in a `v1/`, `v2/`, … folder when versioned)
  - Ensure the slug (folder name) matches the `Slug` property in `Definition.cs` (e.g. `widget-hello-world`)
  - Run `npm run widget:validate` from `frontend/` and fix any reported contract errors
  - Run the frontend (`npm run dev` or `npm run build`) and ensure the backend has been built so `Definition.cs` is compiled and discovered
- **Styles not applying**:
  - Make sure the style property names match what the Style tab / `styleUtils` expect for your widget.
- **Widget showing old definition or renderer**:
  - Restart the API so the seeder reloads definitions; hard-refresh the builder or clear the browser cache.
  - Re-run `npm run widget:validate` and a fresh `npm run build` if the frontend still serves an old bundle.

## 8. AI Assisted Development  
### 8.1 Prep AI Context
Make sure your AI assistant has read this entire guide, and your widget specification requirements document (mentioned below in 8.2)

### 8.2 Widget Specification Requirements Document  
- Create a `<WIDGET_NAME>_specs.md` file in the Widget_Specs folder. (see TEMPLATE.md for an example)
- Remove the placeholder text from the document, and fill in the details.

### 8.3 Example AI prompt  

```
Create a widget that displays the current weather in London, UK.

Requirements:
- Use the Open-Meteo API (https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m)
- Show temperature, weather icon, and description
- Allow user to toggle between Celsius and Fahrenheit
- Follow the structure in Appendix 1.0–1.2 (schema, TypeScript shapes, version endpoints)

Use the CMS Widget Development Guide as reference.
```

### Appendix 1.0 Config Schema for Widgets  

```typescript  
interface WidgetDefinition {
  id: string;                    // UUID
  slug: string;                  // Human-friendly identifier (used for renderer lookup)
  name: string;                  // Display name in widget library
  category: WidgetCategory;      // 'layout' | 'content' | 'media' | 'interactive' | 'navigation'
  description: string;           // Tooltip description
  icon: string;                  // Lucide icon key in kebab-case (https://lucide.dev/icons)
  version: string;               // Semantic version (e.g., '1.0.0')
  thumbnail?: string;            // Optional thumbnail for library grid
  isAdvanced: boolean;           // Show in advanced section if true
  configSchema: WidgetConfigSchema;      // Configuration fields
  defaultConfig: Record<string, unknown>; // Default values
  defaultStyles?: WidgetStyles;          // Optional default styles
  brandIds?: string[];                   // Empty = available to all brands
  supportsHtmlEmbed?: boolean;           // When true, external HTML embed API may serve this widget (needs embed template)
  latestVersionId?: string;              // Reference to the latest version
  createdAt: Date;
  updatedAt: Date;
}
```

### Appendix 1.1 WidgetVersionInfo (C#)

Used by `IWidgetVersionProvider.GetVersionInfo()` for versioned widgets:

```csharp
public record WidgetVersionInfo(
    Guid Id,                        // Unique ID for this specific version
    string Name,                    // Display name
    string Description,             // Description of the widget
    WidgetCategory Category,        // Widget category
    string Icon,                    // Lucide icon key
    string? Thumbnail,              // Optional thumbnail URL
    string ConfigSchema,            // JSON schema for configuration fields
    string DefaultConfig,           // JSON default configuration values
    WidgetStyles? DefaultStyles,    // Default style settings
    string? ChangeLog,              // What changed in this version (null for v1)
    bool IsAdvanced = false,        // Advanced widget flag
    List<Guid>? BrandIds = null,    // Brand restrictions (null = all brands)
    bool SupportsHtmlEmbed = false  // When true, CMS may expose SSR HTML via /api/embed/widget (requires embed template)
);
```

### Appendix 1.2 Version API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/widgets` | List all widget definitions |
| `GET /api/widgets/{id}` | Get widget by ID |
| `GET /api/widgets/{slug}/versions` | List all versions for a widget |
| `GET /api/widgets/{slug}/versions/{version}` | Get a specific version |
| `GET /api/widgets/{slug}/versions/all` | Get all versions with full details |
