# PropertyPro — REST API Specification

**Version:** 1.0 · **Base URL:** `/api/v1` · **Format:** JSON · **Related:** [ROLES.md](./ROLES.md), [DATABASE.md](./DATABASE.md)

---

## 1. Conventions

- **Versioning:** `/api/v1/...`. Breaking changes ship as `/api/v2/...`; old version remains for a deprecation window.
- **REST style:** resources are plural nouns; nested only for true sub‑resources (`/properties/:id/units`).
- **Envelope:**
  ```jsonc
  { "data": …, "meta": { "page", "cursor", "total" }, "error": null }
  // error response:
  { "data": null, "meta": {}, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": […] } }
  ```
- **HTTP codes:** `200` OK · `201` Created · `204` No Content · `400` Validation · `401` Unauthenticated · `403` Forbidden · `404` Not Found · `409` Conflict · `422` Unprocessable (state) · `429` Rate‑limited · `5xx` Server.
- **Auth header:** `Authorization: Bearer <accessToken>`.
- **Pagination:** cursor‑based — request `?cursor=<opaque>&limit=20` (max 100); response `meta.nextCursor`.
- **Filter/sort:** query params `?status=published&price[gte]=1200&sort=-createdAt` (prefix `-` = desc).
- **Idempotency:** `Idempotency-Key` header on POSTs that create chargeable/fan‑out side effects.
- **Request ID:** every response carries `X-Request-Id`; echoed in logs.
- **Validation:** Zod schemas (shared with frontend) → `400` with field details.
- **Timestamps:** ISO‑8601 UTC; money as `{ amount: number, currency: "USD" }`.

---

## 2. Authentication

| Method | Endpoint                | Body / Notes                                                                      |
| ------ | ----------------------- | --------------------------------------------------------------------------------- |
| POST   | `/auth/register`        | `{ email, password, firstName, lastName, role }` → 201 + verification email       |
| POST   | `/auth/verify-email`    | `{ token }`                                                                       |
| POST   | `/auth/login`           | `{ email, password }` → `{ accessToken, user }`; refresh token in HttpOnly cookie |
| POST   | `/auth/refresh`         | Rotates refresh cookie → new access token                                         |
| POST   | `/auth/logout`          | Revokes refresh token (all devices optional)                                      |
| POST   | `/auth/forgot-password` | `{ email }` → always 202 (no user enumeration)                                    |
| POST   | `/auth/reset-password`  | `{ token, newPassword }`                                                          |
| POST   | `/auth/oauth/:provider` | `{ code }` for `google`/`apple`                                                   |
| GET    | `/auth/me`              | Current user + roles + permissions                                                |
| POST   | `/auth/mfa/verify`      | v1.1                                                                              |

**Access token:** JWT, 15 min, claims `{ sub, roles, type:"access" }`. **Refresh token:** opaque, 30 days, stored hashed in DB, rotation + reuse detection (see [SECURITY.md](./SECURITY.md)).

---

## 3. Users

| Method | Endpoint            | Auth  | Notes                                 |
| ------ | ------------------- | ----- | ------------------------------------- |
| GET    | `/users/me`         | ✓     | Full own profile + preferences        |
| PATCH  | `/users/me`         | ✓     | Update profile/preferences (partial)  |
| POST   | `/users/me/avatar`  | ✓     | Presigned upload flow                 |
| DELETE | `/users/me`         | ✓     | Self‑service GDPR delete (anonymize)  |
| GET    | `/users/:id`        | ✓     | Public profile (masked by role)       |
| PATCH  | `/users/:id/roles`  | admin | Role changes (audited)                |
| PATCH  | `/users/:id/status` | admin | Suspend/activate (audited)            |
| GET    | `/users`            | admin | List, filter by role/status, paginate |

---

## 4. Properties & Units

| Method | Endpoint                | Auth               | Notes                                    |
| ------ | ----------------------- | ------------------ | ---------------------------------------- |
| GET    | `/properties`           | owner/admin        | Own properties (or all for admin)        |
| POST   | `/properties`           | owner              | Create property                          |
| GET    | `/properties/:id`       | owner/tenant/admin | Detail + embedded units summary          |
| PATCH  | `/properties/:id`       | owner              | Update                                   |
| DELETE | `/properties/:id`       | owner              | Soft delete (blocks if active tenancies) |
| GET    | `/properties/:id/units` | owner/tenant       | List units                               |
| POST   | `/properties/:id/units` | owner              | Create unit                              |
| PATCH  | `/units/:id`            | owner              | Update unit                              |
| DELETE | `/units/:id`            | owner              | Soft delete                              |

---

## 5. Listings

| Method | Endpoint                       | Auth              | Notes                                    |
| ------ | ------------------------------ | ----------------- | ---------------------------------------- |
| GET    | `/listings`                    | public            | Published only; facets via `facets=1`    |
| GET    | `/listings/:id`                | public            | Detail incl. media, agent, nearby        |
| POST   | `/listings`                    | agent/owner       | Draft create; publish via `PATCH status` |
| PATCH  | `/listings/:id`                | owner (of record) | Update/publish/unpublish                 |
| DELETE | `/listings/:id`                | owner (of record) | Soft delete                              |
| POST   | `/listings/:id/duplicate`      | owner             | Clone draft                              |
| GET    | `/listings/:id/stats`          | owner             | Views, favorites, booking funnel         |
| GET    | `/listings/search`             | public            | Delegates to Meilisearch (see §11)       |
| POST   | `/listings/:id/favorite`       | buyer             | Toggle favorite                          |
| POST   | `/listings/:id/ai-description` | agent/owner       | AI description generator (preview only)  |

---

## 6. Bookings

| Method | Endpoint                                  | Auth         | Notes                                  |
| ------ | ----------------------------------------- | ------------ | -------------------------------------- |
| GET    | `/bookings`                               | ✓            | Own bookings (buyer) / requests (host) |
| GET    | `/bookings/availability?listingId=&date=` | public       | Open slots                             |
| POST   | `/bookings`                               | buyer        | Request booking (optimistic slot lock) |
| PATCH  | `/bookings/:id`                           | host         | Accept / reschedule / reject           |
| PATCH  | `/bookings/:id/cancel`                    | either party | Cancel before cutoff                   |
| POST   | `/bookings/:id/complete`                  | host         | Mark attended/completed                |

Status flow: `requested → confirmed → completed` or `cancelled` / `rejected`. Reminders via `reminders` queue (24h/2h/30m).

---

## 7. Tenancies & Leases

| Method | Endpoint                | Auth         | Notes                                   |
| ------ | ----------------------- | ------------ | --------------------------------------- |
| GET    | `/tenancies`            | owner/tenant | Scoped to own                           |
| POST   | `/tenancies`            | owner        | Create prospective tenancy              |
| POST   | `/tenancies/:id/start`  | owner        | Move to active + generate rent schedule |
| POST   | `/tenancies/:id/end`    | owner/tenant | End/terminate + deposit release flow    |
| GET    | `/tenancies/:id`        | owner/tenant | Detail incl. schedule                   |
| POST   | `/tenancies/:id/leases` | owner        | Create lease draft                      |
| POST   | `/leases/:id/sign`      | tenant/owner | Sign (electronic)                       |
| GET    | `/leases/:id/export`    | tenant/owner | PDF download (signed URL)               |
| PATCH  | `/tenancies/:id/notice` | tenant/owner | Give/record notice                      |

---

## 8. Payments

| Method | Endpoint                | Auth         | Notes                                         |
| ------ | ----------------------- | ------------ | --------------------------------------------- |
| GET    | `/payments`             | ✓            | Own payments (payer/payee), filters, paginate |
| POST   | `/payments/intent`      | tenant/owner | Create Stripe PaymentIntent (idempotency key) |
| POST   | `/payments/:id/confirm` | payer        | Confirm client‑side intent                    |
| GET    | `/payments/:id`         | ✓            | Detail + status                               |
| POST   | `/payments/:id/refund`  | owner/admin  | Full/partial refund                           |
| GET    | `/payments/:id/receipt` | payer        | PDF receipt (signed URL)                      |
| POST   | `/payments/methods`     | payer        | Save payment method (tokenized)               |
| DELETE | `/payments/methods/:id` | payer        | Detach                                        |
| POST   | `/webhooks/stripe`      | public       | Signature‑verified webhook handler            |

**Ledger:** the API never stores raw card data. Only Stripe‑tokenized references.

---

## 9. Maintenance

| Method | Endpoint                    | Auth        | Notes                                           |
| ------ | --------------------------- | ----------- | ----------------------------------------------- |
| GET    | `/maintenance`              | ✓           | Tenant: own; staff: assigned; owner: property   |
| POST   | `/maintenance`              | tenant      | Create ticket (photos, category, urgency)       |
| GET    | `/maintenance/:id`          | ✓           | Detail + timeline                               |
| POST   | `/maintenance/:id/comments` | ✓           | Add timeline event (status transition included) |
| PATCH  | `/maintenance/:id/status`   | staff/owner | Advance workflow                                |
| POST   | `/maintenance/:id/assign`   | owner/admin | Assign staff/vendor                             |
| POST   | `/maintenance/:id/cost`     | owner       | Approve cost (before/actual)                    |
| POST   | `/maintenance/:id/rate`     | tenant      | Rate resolution                                 |
| GET    | `/maintenance/stats`        | owner/admin | MTTR, cost, backlog                             |

Status flow: `open → accepted → in_progress → waiting_parts → resolved → closed`; emergency tickets bypass triage queue.

---

## 10. Communication

| Method | Endpoint                      | Auth            | Notes                                |
| ------ | ----------------------------- | --------------- | ------------------------------------ |
| GET    | `/conversations`              | ✓               | Own threads + unread counts          |
| POST   | `/conversations`              | ✓               | Open thread (context type)           |
| GET    | `/conversations/:id/messages` | ✓ (participant) | Cursor paginated                     |
| POST   | `/conversations/:id/messages` | ✓               | Send message (optimistic `clientId`) |
| POST   | `/conversations/:id/read`     | ✓               | Mark read (updates `readBy`)         |
| POST   | `/conversations/:id/archive`  | ✓               | Archive                              |

**Realtime (Socket.io, authenticated):** `notification:new`, `message:new`, `message:typing`, `presence:online`, `booking:update`, `maintenance:update`. Rooms: `user:{id}`, `conversation:{id}`, `property:{id}:staff`.

---

## 11. Search

| Query param            | Example                                              |
| ---------------------- | ---------------------------------------------------- |
| `q`                    | `q=2bed+loft` (Meilisearch full‑text)                |
| `type`                 | `type=rent`                                          |
| `price`                | `price[gte]=800&price[lte]=2500`                     |
| `beds`, `baths`        | `beds[gte]=2`                                        |
| `amenities`            | `amenities[]=gym&amenities[]=parking` (facet)        |
| `city`, `neighborhood` | `city=Brooklyn` (facet)                              |
| `radius`               | `radius=10&lat=40.71&lng=-74.00` (geo)               |
| `sort`                 | `sort=-createdAt` or `sort=_geoPoint(40.71,-74):asc` |
| `facets`               | `facets=1` returns facet counts in `meta`            |

---

## 12. Uploads

| Method | Endpoint                      | Auth | Notes                                                                                                                    |
| ------ | ----------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/uploads/presign`            | ✓    | `{ kind: "image"\|"document", mimeType, size, ownerType, ownerId }` → `{ uploadId, presignedUrl, objectKey, expiresAt }` |
| POST   | `/uploads/:uploadId/complete` | ✓    | Finalize; returns `media` record                                                                                         |
| GET    | `/uploads/:id/signed`         | ✓    | Temporary signed download URL (private docs)                                                                             |

Rules: images ≤ 15 MB (recompressed client‑side), documents ≤ 25 MB; allowlisted MIME types; virus scan hook on completion; ownership validated at presign.

---

## 13. Analytics

| Method | Endpoint                             | Auth        | Notes                                   |
| ------ | ------------------------------------ | ----------- | --------------------------------------- |
| GET    | `/analytics/overview`                | ✓           | Role‑aware KPI cards + sparklines       |
| GET    | `/analytics/revenue`                 | owner/admin | Monthly revenue, overdue aging          |
| GET    | `/analytics/occupancy`               | owner/admin | Occupancy/vacancy by property           |
| GET    | `/analytics/maintenance`             | owner/admin | MTTR, cost by category                  |
| GET    | `/analytics/listings`                | agent/owner | Views→favorites→bookings funnel         |
| GET    | `/analytics/platform`                | admin       | MAU, listings growth, role distribution |
| GET    | `/analytics/export?kind=…&from=&to=` | ✓           | CSV/PDF signed download                 |

---

## 14. Admin

| Method    | Endpoint                        | Notes                                 |
| --------- | ------------------------------- | ------------------------------------- |
| GET       | `/admin/users`                  | List/ban/suspend, role management     |
| GET       | `/admin/audit-logs`             | Filter by actor, target, action, date |
| GET/POST  | `/admin/announcements`          | Broadcast messaging                   |
| GET/PATCH | `/admin/feature-flags`          | Runtime toggles                       |
| GET       | `/admin/platform-stats`         | Aggregate KPIs                        |
| POST      | `/admin/announcements/:id/send` | Push to segments                      |

---

## 15. Error Codes

| Code                      | Meaning                                          |
| ------------------------- | ------------------------------------------------ |
| `VALIDATION_ERROR`        | Schema/field validation failed                   |
| `UNAUTHENTICATED`         | Missing/expired token                            |
| `TOKEN_REUSED`            | Refresh token replay detected (revoke family)    |
| `FORBIDDEN`               | Authenticated but not authorized                 |
| `NOT_FOUND`               | Resource missing                                 |
| `CONFLICT`                | Unique violation / slot already booked           |
| `UNPROCESSABLE`           | Valid but wrong state (e.g., end active tenancy) |
| `RATE_LIMITED`            | 429                                              |
| `PAYMENT_REQUIRED_ACTION` | 3‑DS challenge needed                            |
| `PROVIDER_DOWN`           | Search/AI/maps degraded                          |
| `INTERNAL`                | Server error (never leaks internals)             |

---

## 16. Rate Limiting

| Tier            | Limit                      | Routes                         |
| --------------- | -------------------------- | ------------------------------ |
| Public browse   | 120 req/min                | GET `/listings`, `/properties` |
| Authenticated   | 300 req/min                | Standard API                   |
| Auth            | 10 req/5 min               | login, register, forgot, OTP   |
| AI              | 30 req/min                 | `/ai/*`, listing AI helpers    |
| Uploads presign | 60 req/10 min              | `/uploads/*`                   |
| Webhooks        | IP‑allowlisted + signature | `/webhooks/*`                  |

---

## 17. Versioning & Deprecation

- Non‑breaking additions (new fields, optional params) land on `/api/v1`.
- Breaking changes → `/api/v2`; announce deprecation via `Sunset` header 90 days prior; remove after migration window.
- Every response header includes `X-Api-Version`.
