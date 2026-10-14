# Widgets

Widgets support **versioning** to allow multiple versions of a widget to coexist. Each version has its own schema, defaults, and renderer.

## Folder Structure

### Versioned Widgets (Recommended)

For widgets that need multiple versions, use version subfolders:

```
widgets/widget-button/
  v1/
    Definition.cs    # IWidgetVersionProvider for v1
    index.tsx        # React renderer for v1
  v2/
    Definition.cs    # IWidgetVersionProvider for v2
    index.tsx        # React renderer for v2
```

You may optionally group widgets under a brand folder (same `widget-<slug>` / `v<n>/` layout):

```
widgets/<brand>/widget-example-header/
  v1/
    Definition.cs
    index.tsx
```

The `Slug` in `Definition.cs` stays `widget-example-header` (no brand segment in the slug). `npm run widget:validate` and the frontend `require.context` discovery support both flat `widgets/widget-*` and nested `widgets/<brand>/widget-*` (e.g. `example-brand/`, `travel-center/`).

| File             | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `Definition.cs`  | Backend version definition implementing `IWidgetVersionProvider`. Auto-discovered by the seeder via reflection. |
| `index.tsx`      | Frontend React component for this version. Auto-discovered at build time. |
| `ssrEndpoints.ts` | Optional. SSR endpoint mapping so the published page can pre-fill API data on first paint. See [Server-side data (SSR) for published pages](#server-side-data-ssr-for-published-pages). |

### Legacy Single-Version Widgets

For simple widgets without versioning needs:

```
widgets/widget-hello/
  Definition.cs      # IWidgetDefinitionProvider (legacy)
  index.tsx
```

| File             | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `Definition.cs`  | Backend widget definition implementing `IWidgetDefinitionProvider`. |
| `index.tsx`      | Frontend React component. |

An optional `Controller.cs` can be added for widget-specific API endpoints.

**No other files in the repo need to be touched** when creating a new widget.
Set `Icon` in `Definition.cs` to any Lucide kebab-case key from <https://lucide.dev/icons> (for example, `layout-grid`).

## Creating a New Widget

From the `frontend/` directory:

```bash
npm run widget:create my-widget
```

Or from the repo root:

```bash
node tools/widget-create.js my-widget
node tools/widget-create.js my-widget travel-center   # -> widgets/travel-center/widget-my-widget/
```

This creates `widgets/widget-my-widget/` (or under `widgets/<brand>/` when a second argument is given) with a scaffold `Definition.cs` and `index.tsx`.

Validate the folder contract at any time:

```bash
npm run widget:validate
```

The scaffold command runs validation automatically after generating files. Frontend `dev`, `build`, and `lint` also run this validation so widget contract issues fail fast.

## How It Works

### Backend (C# / .NET)

1. The `Cms.Persistence.csproj` glob `<Compile Include="..\..\..\widgets\**\*.cs" />` compiles all `.cs` files in this folder.
2. `WidgetDefinitionDiscovery` scans the assembly for both:
   - `IWidgetVersionProvider` implementations (versioned widgets) — creates `WidgetDefinitionVersion` records
   - `IWidgetDefinitionProvider` implementations (legacy widgets) — creates `WidgetDefinition` records directly
3. The database seeder upserts discovered definitions into `widget_definitions` and versions into `widget_definition_versions`.
4. For versioned widgets, the system automatically determines the latest version based on semantic versioning.
5. If you add a `Controller.cs`, it is picked up by `AddApplicationPart` in `Program.cs` -- no registration needed.

### Frontend (Next.js / React)

1. `frontend/components/builder/customRenderers/index.ts` uses `require.context('../../../../widgets', ...)` to find `widget-*/index.tsx` and `widget-*/v*/index.tsx` at build time (including optional `<brand>/widget-*/v*/`).
2. The slug and version from the folder path (e.g. `widget-button/v2`) are matched against the backend to render the correct component.
3. By default, the latest version is used unless a specific version is requested.

## Server-side data (SSR) for published pages

Widgets that load data from a configurable API endpoint (e.g. `apiEndpoint`, `holidayTypesApiEndpoint`) can show that data on the **first paint** of the published page, including when JavaScript is disabled.

**What to add:** An optional file `ssrEndpoints.ts` in the **version folder** (e.g. `widgets/widget-my-widget/v1/ssrEndpoints.ts`). Export a single named export: `endpointSsrMapping`.

**Shapes:**

- **Single endpoint:** `{ endpointKey: 'apiEndpoint', responseKey: 'slides' }`. Optional: `pagination: { page: 1, pageSize: 12 }` for paginated APIs; optional: `responseArrayKeys: ['items', 'data']` to tell the server which keys to look for in the API JSON (tried in order after `responseKey`).
- **Multiple endpoints:** `{ endpointToResponse: [ { endpointKey: 'holidayTypesApiEndpoint', responseKey: 'holidayTypes' }, ... ] }`. Each entry can optionally include `responseArrayKeys`.

**Discovery:** The frontend builds the SSR map at build time from all `widgets/**/v*/ssrEndpoints.ts` files. Slug is derived from the folder path. **No change to** `frontend/lib/widgetEndpointSsr.ts` when adding a new widget.

**Examples:**

Single endpoint (e.g. hero slides):

```ts
// widgets/widget-my-hero/v1/ssrEndpoints.ts
export const endpointSsrMapping = {
  endpointKey: 'apiEndpoint',
  responseKey: 'slides',
} as const;
```

Multiple endpoints (e.g. footer link columns):

```ts
// widgets/widget-my-footer/v1/ssrEndpoints.ts
export const endpointSsrMapping = {
  endpointToResponse: [
    { endpointKey: 'holidayTypesApiEndpoint', responseKey: 'holidayTypes' },
    { endpointKey: 'destinationsApiEndpoint', responseKey: 'destinations' },
    { endpointKey: 'importantLinksApiEndpoint', responseKey: 'importantLinks' },
  ],
} as const;
```

Core logic lives in `frontend/lib/widgetEndpointSsr.ts`; the preview page uses it in `frontend/app/preview/[brandKey]/[[...uri]]/page.tsx`.

## Preview page layout (overflow and text)

To avoid horizontal overflow and clipped text on the preview/published page:

- **Full-width panels (e.g. mega menus):** Do not use `w-screen` (100vw). Use `left-0 right-0 w-full` so the element spans the parent width; otherwise the page can show a white strip and scrollbar overlapping content.
- **Single-line labels (e.g. price pills):** Use `whitespace-nowrap` on the text and `overflow-visible min-w-fit` on the wrapper so the line does not wrap or clip.

See [Documentation/WidgetDevelopmentGuideV2.md](../Documentation/WidgetDevelopmentGuideV2.md) § Preview page layout (overflow and text) for details.

## Widget Definition Structure

### Versioned Widget (Recommended)

Use `IWidgetVersionProvider` for widgets that may have multiple versions:

```csharp
// widgets/widget-button/v2/Definition.cs
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;
using System.Text.Json;

namespace Cms.Widgets.Button.V2;

public sealed class ButtonWidgetV2Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-button";
    public string Version => "2.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var configSchema = JsonSerializer.Serialize(new
        {
            fields = new object[]
            {
                new { name = "text", label = "Button Text", type = "text", required = true },
                new { name = "variant", label = "Variant", type = "select",
                    options = new object[]
                    {
                        new { label = "Primary", value = "primary" },
                        new { label = "Secondary", value = "secondary" }
                    }
                }
            }
        }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(new
        {
            text = "Click Me",
            variant = "primary"
        }, JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0002-000000000001"),
            Name: "Button",
            Description: "Enhanced button with variants",
            Category: WidgetCategory.Interactive,
            Icon: "square",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: new WidgetStyles { Padding = "md", BorderRadius = 8 },
            ChangeLog: "Added variant support and improved styling"
        );
    }
}
```

**Key properties:**
- `Slug` — Must match the parent folder name (e.g., `widget-button`)
- `Version` — Semantic version string (e.g., `"2.0.0"`)
- `Id` — Stable GUID unique to this specific version
- `ChangeLog` — Description of what changed in this version (null for v1)

### Legacy Single-Version Widget

For simple widgets, use `IWidgetDefinitionProvider`:

```csharp
public sealed class MyWidgetDefinition : IWidgetDefinitionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public WidgetDefinition GetDefinition() => new()
    {
        Id = Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"),
        Slug = "widget-my-widget",
        Name = "My Widget",
        Category = WidgetCategory.Content,
        Description = "Short description",
        Icon = "square",
        Version = "1.0.0",
        IsAdvanced = false,
        ConfigSchema = JsonSerializer.Serialize(new { fields = new object[] { } }, JsonOptions),
        DefaultConfig = "{}",
        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    };
}
```

The `Id` is a stable GUID generated once per widget (the scaffold script creates one automatically).

## Widget Renderer Structure

```tsx
'use client';

import React from 'react';
import type { CustomRenderer } from '@/types/renderTemplate';

const Renderer: CustomRenderer = ({ config, styles, theme, widgetId, actions, isPreviewMode }) => (
  <div>{/* your component */}</div>
);

export default Renderer;
```

The component receives `config` (merged with defaults), `styles`, `theme` colors/fonts, and optional `actions`.

## Adding a Widget-Specific API (Optional)

Create a `Controller.cs` alongside the other files:

```csharp
using Microsoft.AspNetCore.Mvc;

namespace Cms.Widgets;

[ApiController]
[Route("api/widgets/my-widget")]
public sealed class MyWidgetController : ControllerBase
{
    [HttpGet("data")]
    public IActionResult GetData() => Ok(new { items = Array.Empty<object>() });
}
```

This controller is automatically discovered -- no registration code needed.

## Version API Endpoints

The backend exposes endpoints to query widget versions:

| Endpoint | Description |
|----------|-------------|
| `GET /api/widgets` | List all widget definitions (latest version info) |
| `GET /api/widgets/{id}` | Get widget definition by ID |
| `GET /api/widgets/{slug}/versions` | List all versions for a widget |
| `GET /api/widgets/{slug}/versions/{version}` | Get a specific version |
| `GET /api/widgets/{slug}/versions/all` | Get all versions with full details |

## Migrating from Legacy to Versioned

To convert an existing legacy widget to versioned:

1. Create a `v1/` folder inside the widget folder
2. Move `Definition.cs` and `index.tsx` into `v1/`
3. Update `Definition.cs` to implement `IWidgetVersionProvider` instead of `IWidgetDefinitionProvider`
4. Change the class to return `WidgetVersionInfo` via `GetVersionInfo()` instead of `WidgetDefinition` via `GetDefinition()`

**Before:**

```
widgets/widget-button/
  Definition.cs      # IWidgetDefinitionProvider
  index.tsx
```

**After:**

```
widgets/widget-button/
  v1/
    Definition.cs    # IWidgetVersionProvider
    index.tsx
```

When creating v2, simply add a `v2/` folder with updated `Definition.cs` (new version string, new ID, changelog) and `index.tsx`.
