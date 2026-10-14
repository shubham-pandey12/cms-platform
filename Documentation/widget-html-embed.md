# Widget HTML embed (SSR fragment)

The Next.js app exposes a **GET** endpoint that returns a **server-rendered HTML fragment** for one **published** widget instance on a page body. Host applications can `fetch` this URL during **SSR** and inline the HTML into their own document for SEO (no iframe).

## Endpoint

`GET /api/embed/widget`

### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `brand` | Yes | Brand id (UUID) or key/slug used with public `getBrandById` / `getPageByUri` (same as preview routes). |
| `widgetId` | Yes | Widget **instance** id from page layout JSON (`WidgetInstance.id`). |
| `uri` | No | Published page path. Omit or empty for home (`/`). Example: `uri=%2Fabout` for `/about`. |
| `lang` | No | Locale for localized config (e.g. `en-GB`). If omitted, the route uses the same default as widget i18n (`DEFAULT_LANG` in `frontend/lib/i18nWidgetConfig.ts`). |

### Authentication

If `EMBED_API_SECRET` is set in the Next.js environment, each request must include either:

- Header `Authorization: Bearer <EMBED_API_SECRET>`, or  
- Query `key=<EMBED_API_SECRET>`

If the variable is **not** set, the endpoint is anonymous (same exposure model as other public read APIs).

When the secret **is** set but the request does not provide a valid Bearer token or `key`, the API returns **403** with `Cache-Control: no-store`.

### HTTP status codes (summary)

| Status | When |
|--------|------|
| **200** | HTML fragment returned. |
| **400** | Missing `brand` or `widgetId`. |
| **403** | `EMBED_API_SECRET` is configured but auth/query key is missing or wrong. |
| **404** | Brand/page not found, widget instance not on **page body**, or definition does not allow embed (`supportsHtmlEmbed` false in API JSON / `SupportsHtmlEmbed` in C#). |
| **501** | Embed is allowed for the widget but no template is registered in `frontend/lib/embed/embedRenderers.tsx` (`getEmbedRenderer` has no mapping for that slug). |

### Supported widget types

A widget is embeddable when its **widget definition** has `supportsHtmlEmbed: true` in API responses (stored from `SupportsHtmlEmbed` on `WidgetVersionInfo` in each version’s `Definition.cs`, seeded into the database) **and** the Next.js app registers a template in `frontend/lib/embed/embedRenderers.tsx` (internal slug → component map used by `getEmbedRenderer`). If the flag is false or the instance is not on the page body, the API returns **404**. If the flag is true but no template exists yet, the API returns **501**. Examples with both flag and template today: **widget-cta**, **widget-button**, **widget-form** (contact form uses native HTML `POST` to `submitEndpoint` / `endpoint`; use an **absolute** URL for `action` when the host page is on another origin).

### Caching

Responses include `Cache-Control: public, s-maxage=120, stale-while-revalidate=300`. Tune at the CDN or adjust the constant in `frontend/app/api/embed/widget/route.ts` if needed.

## From the builder

1. Open the **page builder** for a brand and select a **page**.
2. Click a **body** widget (not header/footer layout widgets).
3. In the right **properties** panel, use **HTML embed (external sites)**:
   - Allowed types (e.g. CTA, button, **contact form**) show **Copy embed link** and a language selector (same supported languages as the site).
   - Layout widgets show a short note that only body widgets are embeddable.
   - Other widget types show that HTML embed is not enabled for that definition (or no SSR template exists yet).
4. Paste the copied URL into your host app’s server-side `fetch` (or docs).

Copied URLs use **`NEXT_PUBLIC_APP_ORIGIN`** when set (production-friendly); otherwise the current browser origin. The secret is **never** included in the copied link; server-side callers add auth if `EMBED_API_SECRET` is configured.

## Host integration (example)

Server-side only; **trust** the CMS origin before using `dangerouslySetInnerHTML` / `Html.Raw`.

```ts
const base = process.env.CMS_FRONTEND_URL; // e.g. https://cms.example.com
const url = new URL('/api/embed/widget', base);
url.searchParams.set('brand', brandKey);
url.searchParams.set('widgetId', instanceId);
url.searchParams.set('uri', '/your-page-path');
if (process.env.CMS_EMBED_SECRET) {
  url.searchParams.set('key', process.env.CMS_EMBED_SECRET);
}
const res = await fetch(url.toString(), { next: { revalidate: 120 } });
if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
const html = await res.text();
// Inject `html` into your layout during SSR.
```

## Limitations

- Searches **page body** only (not site layout header/footer widgets).
- HTML is **SEO-oriented** and may not be pixel-identical to the interactive preview widget.
- Adding embed support requires `SupportsHtmlEmbed: true` on the widget’s `WidgetVersionInfo` in `Definition.cs`, a DB migration/seed refresh if needed, and an embed template in `embedRenderers.tsx`.
