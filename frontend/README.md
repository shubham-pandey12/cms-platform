# MCMS Next.js Frontend

This is the Next.js migration of the MCMS frontend, providing server-side rendering for public pages and a client-side React app for the admin page builder.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_API_BASE_URL=https://localhost:5001/api
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Architecture

- **Public Routes (SSR)**: `/preview/[brandKey]/[[...uri]]` - Server-side rendered for SEO
- **Admin Routes (Client)**: `/login`, `/brands`, `/builder/[brandId]` - Client-side React app
- **Page builder shell** (`/builder/[brandId]`): `GoogleSitesHeader`, `GoogleSitesCanvas`, `WidgetLibraryPanel` ([`components/builder/widget-library-panel/`](./components/builder/widget-library-panel/) — Insert / Pages / Themes), and `PropertiesPanel`

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin routes (client-side)
│   │   ├── login/
│   │   ├── brands/
│   │   └── builder/
│   ├── preview/           # Public routes (SSR)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── builder/          # Page builder components
│   ├── ui/               # shadcn/ui components
│   └── viewer/           # Published page viewer
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
├── services/             # API services
└── types/                # TypeScript types
```

## Features

- ✅ Server-side rendering for public pages (SEO optimized)
- ✅ Widget SSR: optional `ssrEndpoints.ts` in repo-level `widgets/` pre-fills API data on first paint (`lib/widgetEndpointSsr.ts`)
- ✅ Client-side page builder (preserves all existing functionality)
- ✅ JWT authentication with middleware protection
- ✅ Tailwind CSS styling
- ✅ TypeScript support

Widget renderers are loaded from the repo-level `widgets/` folder via `customRenderers/index.ts` (require.context). See [../widgets/README.md](../widgets/README.md) and [../Documentation/WidgetDevelopmentGuideV2.md](../Documentation/WidgetDevelopmentGuideV2.md) for creating and versioning widgets.

