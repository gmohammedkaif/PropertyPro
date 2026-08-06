# PropertyPro — System Architecture

**Version:** 1.0 · **Stack:** React + Express + MongoDB · **Related:** [DATABASE.md](./DATABASE.md), [API.md](./API.md), [ROLES.md](./ROLES.md)

---

## 1. Architectural Overview

PropertyPro follows a **modular monolith** architecture in a **pnpm monorepo**. The API is a single deployable Express service organized into feature modules with strict boundaries, so it can be split into microservices later without a rewrite. The frontend is a React SPA consuming a versioned REST API plus WebSockets for realtime features.

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                      │
│  React 18 · TypeScript · Vite · React Router · TanStack Query  │
│  Zustand · Radix UI · Tailwind · Framer Motion                 │
└───────────────┬───────────────────────────────┬────────────────┘
                │ REST /api/v1 (HTTPS)          │ Socket.io (wss)
┌───────────────▼───────────────────────────────▼────────────────┐
│                     API GATEWAY (Express)                       │
│  Helmet · CORS · rate limit · body limits · request validation  │
│  JWT auth middleware · role/ownership guards · error handler    │
└───────────────┬───────────────────────────────┬────────────────┘
                │                               │
      ┌─────────▼─────────┐           ┌─────────▼─────────┐
      │  FEATURE MODULES  │           │   REALTIME HUB    │
      │  auth · users     │           │  Socket.io        │
      │  properties ·     │           │  notifications ·  │
      │  listings ·       │           │  chat · presence  │
      │  tenancies ·      │           └─────────┬─────────┘
      │  leases ·         │                     │
      │  payments ·       │                     │
      │  maintenance ·    │                     │
      │  bookings ·       │                     │
      │  search · ai ·    │                     │
      │  analytics ·      │                     │
      │  admin · uploads  │                     │
      └─────────┬─────────┘                     │
                │                               │
   ┌────────────┼───────────────┬───────────────┼──────────────┐
   ▼            ▼               ▼               ▼              ▼
MongoDB 7     Redis 7       S3/R2 (files)   Meilisearch     BullMQ jobs
(primary     (cache,        (presigned      (search index   (emails,
 data)        sessions,      URLs)           mirror)         analytics,
              rate limits)                                   notifications)
```

---

## 2. Monorepo Structure

```
propertypro/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/            # Router, providers, layout shells (auth, dashboard)
│   │   │   ├── components/
│   │   │   │   ├── ui/         # Design‑system components (from packages/ui)
│   │   │   │   ├── shared/     # Composed shared components (PropertyCard, DataTable…)
│   │   │   │   └── domain/     # Entity‑specific composites
│   │   │   ├── features/       # Feature modules (one per domain)
│   │   │   ├── hooks/          # Shared hooks (useAuth, useTheme, useDebounce…)
│   │   │   ├── lib/            # API client, socket client, utils, formatters
│   │   │   ├── stores/         # Zustand stores (auth, theme, ui)
│   │   │   ├── styles/         # Tokens, global styles, Tailwind entry
│   │   │   └── types/          # App‑level types (re‑exported from packages/shared)
│   │   └── vite.config.ts
│   └── api/
│       └── src/
│           ├── app.ts          # Express app factory (testable, no listen)
│           ├── server.ts       # Bootstrap: config, db, redis, jobs, listen
│           ├── modules/        # Feature modules (each: routes + service + schemas)
│           ├── core/           # config, logger, db, redis, auth infra, errors
│           ├── middleware/     # guards, validation, rate limit, error handler
│           ├── jobs/           # BullMQ workers
│           ├── events/         # Event bus (typed) for inter‑module decoupling
│           ├── realtime/       # Socket.io setup, rooms, presence
│           └── utils/
├── packages/
│   ├── ui/                     # Design tokens, primitives, Storybook
│   ├── shared/                 # Zod schemas, TS types, constants, currency utils
│   ├── config/                 # ESLint, Prettier, TSConfig presets
│   └── database/               # Mongoose models, migrations, seed scripts
├── docs/
├── infra/                      # Dockerfile(s), docker-compose, CI workflows, k8s (later)
└── package.json
```

**Rules:**

- `apps/web` never imports from another app; both import only from `packages/*`.
- Each `features/<name>` owns its UI components, hooks, API hooks, and store slices.
- Contracts live once in `packages/shared` (Zod schema ⇒ TS type) and are consumed by both API validation and frontend forms — single source of truth.

---

## 3. Frontend Architecture

### 3.1 Data flow

```
UI component ──hook (useQuery/useMutation)──▶ TanStack Query cache
                                                  │
                                    REST client (axios/fetch wrapper)
                                                  │
                              /api/v1  +  JWT access token (memory)
```

- **Server state:** TanStack Query — caching, background refetch, optimistic updates, infinite scroll.
- **Client state:** Zustand — auth session, theme, sidebar, toasts, filters that don't belong in the URL.
- **Forms:** React Hook Form + Zod (schema shared with the API).
- **Realtime:** Socket.io client writes directly into query cache (e.g., `notifications.unreadCount`, chat messages), keeping UI reactive.

### 3.2 Routing

- React Router v6+ with route‑level lazy loading (code splitting per route).
- Public routes: landing, browse, property detail, auth.
- Protected routes behind `<AuthGuard>`; role‑specific via `<RoleGuard roles={[...]}>`.
- Nested dashboard shell: sidebar + navbar + `<Outlet/>`.

### 3.3 State of the view

Every data view implements four explicit states: **loading** (skeletons), **empty** (empty‑state illustration + CTA), **error** (message + retry), and **success**. Enforced by a shared `<AsyncBoundary>`/`QueryBoundary` wrapper.

---

## 4. Backend Architecture

### 4.1 Request lifecycle

```
HTTP request
  → Helmet/security headers, CORS, request ID
  → Body size limits, JSON parse
  → Rate limiter (per IP + per user for sensitive routes)
  → JWT auth (optional on public routes)
  → Zod schema validation (body/query/params)
  → Authorization guards (role + ownership resolver)
  → Feature module controller → service → repositories/models
  → Serializer (field masking by role)
  → Standard envelope response { data, meta, error }
  → Central error handler (typed errors → status + error.code)
```

### 4.2 Layering inside each module

```
routes/     → define HTTP surface + wire middleware
schemas/    → Zod request/response schemas
service/    → business logic, orchestration, events, transactions
repo/       → Mongoose queries, aggregations, search/geo (thin data access)
```

- Controllers stay thin; services hold logic; repositories encapsulate MongoDB specifics.
- Cross‑module calls use the **typed event bus** (e.g., `payment.succeeded` → send receipt email + update ledger + notify landlord) instead of direct imports — keeps modules decoupled and jobs retryable.

### 4.3 Background processing (BullMQ + Redis)

| Job queue           | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `email`             | Transactional emails (receipts, verification, reminders) |
| `notifications`     | Fan‑out of in‑app notifications + realtime push          |
| `search-sync`       | Write‑through indexing to Meilisearch                    |
| `analytics-rollup`  | Nightly aggregations into `analytics_daily`              |
| `payment-reconcile` | Nightly reconciliation with Stripe                       |
| `reminders`         | Rent overdue, booking reminders, SLA timers              |

---

## 5. Cross‑Cutting Services

### 5.1 Search (Meilisearch)

- Write‑through: listing create/update/status change enqueues `search-sync`.
- Index schema: id, title, description, type, price, bedrooms/bathrooms, area, location (geo point), amenities facets, status, createdAt.
- Queries: typo‑tolerant full‑text, facet filters, geo radius, sort by relevance/price/newest.
- Backfill CLI (`pnpm --filter api search:reindex`) for rebuilds.

### 5.2 Uploads (S3/R2 + presigned URLs)

1. Client → `POST /api/v1/uploads/presign` (validates type/size/MIME, ownership, quota).
2. API returns `{ uploadId, presignedUrl, objectKey }`.
3. Browser uploads directly to object storage (progress events).
4. Client → `POST /api/v1/uploads/:uploadId/complete` → media record created and attached.
5. Server‑side image transforms (thumbnail/hero variants) via queue; blur‑up placeholders in UI.

### 5.3 Realtime (Socket.io)

- One authenticated namespace; rooms derived from user scope (`user:{id}`, `conversation:{id}`, `property:{id}:staff`).
- Events: `notification:new`, `message:new`, `message:typing`, `presence:online`, `booking:update`, `maintenance:update`.
- Middleware validates the JWT on the socket handshake; presence tracked in Redis.
- Offline users receive notifications via `notifications` DB docs + email fallback.

### 5.4 AI (OpenAI)

- **Listing copilot:** structured input (property attributes) → polished description + tags; human review before publish.
- **Valuation:** comparable listings + features + geo → price band; cached in `ai_analysis_cache`.
- **Maintenance triage:** title/photos/urgency → priority + suggested vendor; overridable by staff.
- **Tenant copilot:** RAG over the tenant's own lease/payment/maintenance context; strict tenant isolation.
- All AI calls rate‑limited, logged, PII‑stripped, and non‑blocking to the request path where possible.

### 5.5 Payments (Stripe behind an interface)

- `PaymentProvider` interface; v1.0 = Stripe. Swap/parallel rails (Razorpay, Adyen) without touching services.
- Idempotency keys on all charge/refund paths; webhook endpoints signature‑verified and idempotent.
- Local `payments` collection is the **source of truth** for the app; Stripe is the PSP adapter.

---

## 6. Key Business Flows

### 6.1 Booking a viewing

```
Buyer picks listing → availability grid (owner/agent slots)
→ POST /bookings (slot lock w/ optimistic concurrency)
→ owner/agent notified (realtime + email)
→ accept / reschedule / reject
→ confirmed → calendar event + reminder chain (24h/2h/30m)
→ completion → review prompt + attendance record
```

### 6.2 Rent cycle

```
Lease signed → rent schedule generated (amount, due date, escalation)
→ tenant notified → pays via Stripe (card/bank)
→ webhook verified → payment record + receipt + ledger update + landlord notify
→ overdue → reminders (3) → late fee → escalation to owner dashboard
→ monthly → collection report + tax summary export
```

### 6.3 Maintenance lifecycle

```
Tenant submits ticket (photos, category, urgency)
→ AI triage → staff/vendor assignment
→ OPEN → ACCEPTED → IN_PROGRESS → WAITING_PARTS → RESOLVED → CLOSED
→ SLA timers; comments/logs; owner cost approval
→ resolution → tenant rating → analytics (MTTR, cost)
```

---

## 7. Resilience & Scalability

- **Stateless API:** sessions/queues/cache in Redis; horizontal scaling behind a load balancer.
- **Graceful degradation:** search/maps/AI degrade to DB fallback if a provider is unavailable.
- **Idempotency:** webhooks, payments, notifications fan‑out.
- **Caching tiers:** Redis (hot reads: user profile, listing detail, feature flags) → query cache (TanStack) → HTTP cache headers for public assets.
- **DB:** read replicas (Atlas), compound indexes per access pattern, aggregation rollups off the hot path.
- **Backpressure:** BullMQ concurrency limits; uploads never proxied through the API.
- **Observability:** structured logging (Pino), request IDs, Sentry for errors, OpenTelemetry traces, health endpoints (`/healthz`, `/readyz`).

---

## 8. Failure Handling

| Scenario       | Strategy                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| DB down        | Health check fails; API returns 503; clients show retry state                |
| Redis down     | Cache bypass (degrade to DB); sessions fall back to DB‑stored refresh tokens |
| Search down    | Fallback to Mongo text/geo queries with reduced relevance                    |
| AI down        | Listing publish proceeds without AI suggestions; valuation unavailable       |
| Stripe outage  | Payments queue + retry; UI shows "payment processing" state                  |
| Webhook replay | Idempotency keys dedupe; audit log records every event                       |

---

## 9. Tech Decisions & Rationale

| Decision                   | Choice                  | Rationale                                                                                           |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| Monorepo                   | pnpm workspaces         | Shared contracts, one CI, atomic cross‑package changes                                              |
| SPA (no SSR)               | React + Vite            | Rich interactivity, cheap hosting, edge CDN; SEO limited to landing (handled via prerender/sitemap) |
| Express (not Fastify/Nest) | Express 5 + TS          | Mature ecosystem, broad hiring pool, easy middleware model                                          |
| MongoDB primary            | Mongo 7 + Mongoose      | Document model fits polymorphic real‑estate entities; no rigid joins; easy horizontal scale         |
| Redis                      | Cache + queues          | Dual role; widely available managed                                                                 |
| Meilisearch                | Typo‑tolerant search    | Instant UX, facets + geo out of the box, self‑hostable                                              |
| TanStack Query + Zustand   | Data + UI state         | Industry standard, devtools, minimal boilerplate                                                    |
| Radix + Tailwind           | Headless a11y + utility | Accessible primitives + fast design‑system theming                                                  |
