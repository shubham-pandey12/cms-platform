# Content Studio - Developer Guide

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query |
| **Backend** | ASP.NET Core 10, Entity Framework Core, PostgreSQL |

## Prerequisites

- Node.js 18+ and npm
- .NET 10 SDK
- Docker Desktop (for Aspire orchestration or devops Docker Compose)
- PostgreSQL 15+ (only if running standalone without Aspire/Docker)

## Running the Project

### Option 1: With .NET Aspire (Recommended)

Aspire orchestrates PostgreSQL container and API automatically.


---
**Manual run:**

```bash
cd orchestration/Cms.AppHost

# Run Aspire orchestration
dotnet run
```

Aspire dashboard opens at `http://localhost:15xxx` with:
- API endpoint
- PostgreSQL connection details
- pgAdmin interface

### Option 2: Standalone (Without Aspire)

#### Backend

```bash
cd backend/src/Cms.Api

# Create .env file with your PostgreSQL connection / update connection string in appsettings.Development.json.
# The API uses the connection name "cmsdb" (must match AddNpgsqlDbContext).
echo 'ConnectionStrings__cmsdb=Host=localhost;Database=cmsdb;Username=postgres;Password=yourpassword' > .env

# Restore dependencies
dotnet restore

# Apply migrations
dotnet ef database update --project ../Cms.Persistence

# Run API
dotnet run
```

API runs at `https://localhost:5001`. When running in Development, a health check is available at `/dev/health` (and `/health`, `/alive` via Aspire service defaults).

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo 'NEXT_PUBLIC_API_BASE_URL=https://localhost:5001/api' > .env.local

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`. A liveness endpoint is available at `http://localhost:3000/dev/health` (returns `{ "status": "ok" }`).

### Option 3: Docker

Run the full stack (PostgreSQL, API, frontend) with Docker Compose. Use this for a consistent dev/test environment without installing Node or .NET locally.

**From repo root (PowerShell):**

```powershell
# Build images (API + frontend)
docker compose -f docker-compose.yaml --env-file .env.Development build

# Start stack
docker compose -f docker-compose.yaml --env-file .env.Development up -d
```

- **API:** `http://localhost:8080` (health: `http://localhost:8080/health` or `http://localhost:8080/dev/health` in Development)
- **Frontend:** `http://localhost:3000` (health: `http://localhost:3000/dev/health`)

**Health checks:** Both services expose a liveness endpoint at `/dev/health`. The API maps it only when `ASPNETCORE_ENVIRONMENT` is `Development`; the frontend returns JSON `{ "status": "ok" }`. Docker Compose uses these for container healthchecks.

**Important:** Open the app in the browser using **`http://localhost:3000`**, not `http://0.0.0.0:3000`. Using `localhost` ensures "Sign in with MOS" redirects work correctly after auth.

**Configuration:** Copy `.env.example` to `.env.Development` (or `.env.UAT` / `.env.Production`) and set at least `POSTGRES_PASSWORD`. For MOS sign-in, set `MosGateway__*` and frontend build args (`NEXT_PUBLIC_MOS_GATEWAY_URL`, `NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID`) as in the example.

**Stop the stack:**

```powershell
docker compose -f docker-compose.yaml --env-file .env.Development down
```

### Authentication

- **Sign in with MOS:** The app supports OAuth via the MOS Gateway. Configure `MosGateway__*` (backend) and `NEXT_PUBLIC_MOS_GATEWAY_*` (frontend) when using this flow. See `.env.example` for variables. Set `MosGateway__TimeoutSeconds` high enough (default **60**) for token exchange from your network; values around **10** often surface as **408** from the API when the gateway is slow.
- **SSO diagnostics:** The frontend emits JSON lines prefixed with `[sso]` from `/signin` and `/signin-callback` (proxy headers, `redirect_uri`, callback phases; no tokens or auth codes). The API logs SSO steps at **Information** under `AuthController` / `AuthService` (redirect URI, code length, token exchange outcome, identity source). Filter CloudWatch or container logs on `sso` / `SSO`.
- **Default accounts** (when not using MOS or for local seeding):

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Admin |
| content@example.com | Content123! | ContentTeam |

## Adding New Widgets

Widgets are **folder-based** and **auto-discovered**. No manual edits to `DatabaseSeeder.cs` or the custom renderer registry are required.

1. **Create a widget** from the repo root or from `frontend/`:
   ```bash
   node tools/widget-create.js my-widget
   # or: node tools/widget-create.js my-widget travel-center  -> widgets/travel-center/widget-my-widget/
   # or from frontend/: npm run widget:create my-widget
   ```
   This creates `widgets/widget-my-widget/` with a scaffold `Definition.cs` and `index.tsx` (or under `widgets/<brand>/` when a second argument is given).

2. **Versioned widgets** (recommended): use subfolders `widgets/widget-{slug}/v1/`, `v2/`, etc. (or `widgets/<brand>/widget-{slug}/v1/` when grouped by brand). Each version has its own `Definition.cs` (implementing `IWidgetVersionProvider`) and `index.tsx`. Backend discovers versions via reflection; frontend discovers renderers at build time.

3. **Optional SSR**: If your widget fetches from a configurable API and the published page should show that data on first paint, add `ssrEndpoints.ts` in the version folder. See [widgets/README.md](widgets/README.md#server-side-data-ssr-for-published-pages).

**Full details:** [widgets/README.md](widgets/README.md) and [Widget Development Guide V2](Documentation/WidgetDevelopmentGuideV2.md).

## Project Structure

```
content-studio/
├── Dockerfile                    # API and Frontend (docker build --target api -t cms-api . ; --target frontend -t cms-frontend .)
├── Jenkinsfile                   # Jenkins pipeline (backend + frontend build/test, optional Docker build)
├── docker-compose.yaml           # Development stack (postgres, API, frontend)
├── docker-compose.uat.yaml       # UAT (RDS, no DB container)
├── docker-compose.production.yaml # Production (RDS)
├── .env.example                  # Env template; copy to .env.Development / .env.UAT / .env.Production
├── backend/src/
│   ├── Cms.Api/             # API endpoints, Program.cs
│   ├── Cms.Domain/          # Domain entities (WidgetDefinition, Page, etc.)
│   └── Cms.Persistence/     # Migrations; widget definitions discovered from widgets/
├── frontend/                     # Next.js App Router, builder, viewer
│   ├── app/                      # (admin)/, preview/, signin, signin-callback
│   ├── components/               # builder/, ui/, viewer/
│   ├── lib/                      # styleUtils, iconRegistry, widgetEndpointSsr, etc.
│   ├── services/                 # API services
│   └── types/                    # TypeScript types
├── widgets/                      # Folder-based widgets (auto-discovered)
│   ├── widget-{slug}/            # Definition.cs, index.tsx; optional v1/, v2/, ssrEndpoints.ts
│   └── {brand}/widget-{slug}/   # Optional brand grouping (e.g. travel-center/); same versioned layout
├── Documentation/                # Architecture and guides
└── tools/                        # Scripts (e.g. widget-create.js)
```

## Environment and configuration

- **Standalone backend:** `backend/src/Cms.Api/.env` (see `.env.example` there); connection name is `cmsdb`.
- **Standalone frontend:** `frontend/.env.local` (e.g. `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MOS_GATEWAY_*`).
- **Docker:** Use `.env.Development` (from `.env.example`); never commit real secrets.

## CI/CD (Bitbucket and Jenkins)

**Bitbucket:** Pipelines are defined in **`bitbucket-pipelines.yml`** at the repo root. The same Docker build used locally runs in CI.

**Jenkins:** Use **`Jenkinsfile`** at the repo root (Pipeline from SCM). Root **`Dockerfile`** builds both images via `--target api` and `--target frontend`; docker-compose uses the same file.

- **Default / PRs:** Backend (restore, build, test) and frontend (install, build, lint). No Docker step.
- **`main` / `master`:** Same as default, then Docker Compose build using `docker-compose.production.yaml`. Image tags include commit SHA (e.g. `cms-api:abc1234`).
- **`Development`:** Same as default, then Docker Compose build using `docker-compose.uat.yaml`. Image tags use `uat-` prefix (e.g. `cms-api:uat-abc1234`).

**Repository variables** (Repository settings → Pipelines → Repository variables): set optionally for frontend build args and MOS sign-in (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MOS_GATEWAY_URL`, `NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID`). For pushing images, set `DOCKER_REGISTRY`, `DOCKER_USER`, `DOCKER_PASSWORD` (or AWS_* for ECR) and uncomment the push lines in the pipeline.

## Documentation

- [Dynamic URL pages](Documentation/DynamicUrlPages.md) - Patterns, route params, widgets, builder vs published behavior
- [High-Level Design](Documentation/HighLevelDesign.md) - Architecture, domains, and major system behaviors
- [Widget Development Guide V2](Documentation/WidgetDevelopmentGuideV2.md) - Current widget development (folder-based, versioning, optional SSR)
- [widgets/README.md](widgets/README.md) - Widget folder structure, CLI, and SSR for published pages
- [Widget System Overview](Documentation/WidgetSystemOverview.md) - End-to-end widget flow
- [Internationalization (i18n)](Documentation/I18n.md) - Widget-level locales, Site Settings, and `lang` in the viewer
- [Widget HTML embed](Documentation/widget-html-embed.md) - SSR HTML fragment API (`/api/embed/widget`) and builder embed links
- [Semantic Guidelines](Documentation/Semantic.md) - Accessibility best practices
