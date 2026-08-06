# PropertyPro — Database Design (MongoDB)

**Version:** 1.0 · **Primary store:** MongoDB 7 · **Supporting:** Redis, Meilisearch · **Related:** [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md)

---

## 1. Design Principles

1. **Document‑first modeling.** Polymorphic entities (properties, units, listings, role‑scoped users) map naturally to documents without rigid joins.
2. **Read‑optimized.** Denormalize hot read fields (e.g., a compact `listingSummary` inside bookings) to avoid multi‑hop lookups.
3. **Embed or reference deliberately.**
   - _Embed:_ small bounded lists (amenities, tags, media meta, timeline events).
   - _Reference (`ObjectId`):_ large or shared entities (users, properties, tenancies, payments).
4. **Auditability.** `createdAt`, `updatedAt`, `createdBy`, `updatedBy` on every collection; privileged actions also append to `audit_logs`.
5. **Soft delete.** `deletedAt` on user‑facing collections; hard delete only for ephemeral tokens.
6. **Index‑first.** Every query in the app has a supporting compound index.
7. **No MongoDB joins for critical paths.** The few real relationships are resolved via denormalized refs + application‑level validators.

---

## 2. ER Diagram

```
USER ◄──OWNER──────── PROPERTY          PROPERTY ──1:N──► UNIT
USER ◄──AGENT──────── LISTING ──1:1──── PROPERTY
USER ◄──BUYER──────── BOOKING ──N:1──── LISTING
USER ◄──TENANT─────── TENANCY ──N:1──── PROPERTY/UNIT
TENANCY ──1:N────► LEASE
TENANCY ──1:N────► PAYMENT
LEASE ──1:N──────► PAYMENT (rent installments)
TENANCY ──1:N────► MAINTENANCE_REQUEST
USER ──1:N───────► MAINTENANCE_REQUEST (reportedBy / assignedTo)
USER ◄──PARTICIPANT─ CONVERSATION ──1:N──► MESSAGE
USER ──1:N───────► NOTIFICATION
USER ──1:N───────► SAVED_SEARCH
USER ──1:N───────► FAVORITE ──N:1──► LISTING
USER ──1:N───────► REVIEW
```

---

## 3. Collection Reference

| #   | Collection              | Purpose                         | Key indexes                                                      |
| --- | ----------------------- | ------------------------------- | ---------------------------------------------------------------- |
| 1   | `users`                 | All roles, auth, profile, prefs | `email` (unique), `phone`, `slug`                                |
| 2   | `refresh_tokens`        | Revocable sessions (hashed)     | `tokenHash` (unique, TTL), `userId`                              |
| 3   | `password_reset_tokens` | Reset flows (TTL)               | `tokenHash` (unique, TTL)                                        |
| 4   | `otp_codes`             | Email/phone OTPs (TTL)          | `userId`+`purpose`                                               |
| 5   | `properties`            | Buildings/estates               | `ownerId`, `{ownerId,status}`, geo                               |
| 6   | `units`                 | Rentable/sellable units         | `propertyId`, `{propertyId,status}`                              |
| 7   | `listings`              | Active sale/rent postings       | `status`, `price`, geo `2dsphere`, `slug`                        |
| 8   | `tenancies`             | Active & past tenancy records   | `{tenantId,status}`, `unitId`, `propertyId`                      |
| 9   | `leases`                | Lease docs & terms              | `tenancyId`, `tenantId`                                          |
| 10  | `payments`              | Rent, deposits, fees, receipts  | `{tenantId,status}`, `{propertyId,createdAt}`, `paymentIntentId` |
| 11  | `maintenance_requests`  | Work tickets                    | `{status,assignedTo}`, `{propertyId,createdAt}`                  |
| 12  | `bookings`              | Viewing/visit bookings          | `{listingId,slotStart}`, `{userId,status}`                       |
| 13  | `saved_searches`        | Filters + alert frequency       | `userId`                                                         |
| 14  | `favorites`             | Saved listings                  | `{userId,listingId}` (unique)                                    |
| 15  | `reviews`               | Ratings for agents/properties   | `{targetType,targetId}`                                          |
| 16  | `conversations`         | Chat thread metadata            | `participants`, `updatedAt`                                      |
| 17  | `messages`              | Message history                 | `conversationId` (+ TTL for hard‑deleted)                        |
| 18  | `notifications`         | In‑app notifications            | `{userId,readAt}`, `createdAt` (TTL)                             |
| 19  | `audit_logs`            | Immutable action log            | `{actorId,createdAt}`, `{targetType,targetId}`                   |
| 20  | `media`                 | File metadata for objects       | `{ownerType,ownerId}`, `bucketKey`                               |
| 21  | `ai_analysis_cache`     | Cached AI outputs               | `{type,hash}` (unique), `expiresAt` (TTL)                        |
| 22  | `analytics_events`      | Raw event capture               | `{name,createdAt}`                                               |
| 23  | `analytics_daily`       | Nightly rollups                 | `{metricKey,day}` (unique)                                       |
| 24  | `announcements`         | Admin broadcast messages        | `publishedAt`                                                    |
| 25  | `feature_flags`         | Runtime toggles                 | —                                                                |
| 26  | `payment_methods`       | Stripe customer/method refs     | `userId`, `stripeMethodId`                                       |

---

## 4. Core Schemas (field highlights)

### 4.1 `users`

```jsonc
{
  _id: ObjectId,
  email: string,            // unique, lowercase
  phone: string|null,
  passwordHash: string|null,// null when OAuth‑only
  roles: ["buyer", "tenant", "owner", "agent", "maintenance", "admin"],
  profile: { firstName, lastName, avatarKey, bio, locale, timezone },
  status: "pending_verification" | "active" | "suspended",
  emailVerifiedAt: Date|null,
  oauth: [{ provider: "google"|"apple", subject }],
  preferences: { theme, notifications: {...} },
  mfaEnabled: bool, mfaSecretCipher: string|null,   // v1.1
  stripeCustomerId: string|null,
  audit: { createdAt, updatedAt, createdBy, updatedBy },
  deletedAt: Date|null     // soft delete
}
```

### 4.2 `properties`

```jsonc
{
  _id, ownerId: ObjectId,            // ref users
  name, type: "apartment"|"house"|"commercial"|"mixed",
  address: { line1, line2, city, state, postalCode, country },
  location: { type: "Point", coordinates: [lng, lat] },  // 2dsphere
  units: [ { ref unitId, label, status } ],               // denormalized summary
  amenities: ["parking","gym","pool","pet_friendly","furnished"],
  totalUnits, occupiedUnits,          // rollup counters (maintained by service)
  status: "active"|"archived",
  audit, deletedAt
}
```

### 4.3 `listings`

```jsonc
{
  _id, propertyId: ObjectId|null, unitId: ObjectId|null,
  sellerId: ObjectId,                // agent or owner
  type: "rent"|"sale",
  title, description, slug,          // unique
  price: { amount, currency, per: "month"|"total", deposit? },
  beds, baths, areaSqFt,
  location: { type: "Point", coordinates },  // 2dsphere
  amenities: [],
  media: [ { key, variant, alt } ],          // embedded summary of `media`
  status: "draft"|"published"|"under_offer"|"rented"|"sold"|"unpublished",
  publishedAt: Date|null,
  viewCount, favoriteCount,          // counters (service‑maintained)
  aiSuggestions: { description, tags, valuationRange } | null,
  audit, deletedAt
}
```

### 4.4 `tenancies`

```jsonc
{
  _id, propertyId, unitId, ownerId,
  tenantIds: [ObjectId], coTenantIds: [ObjectId],
  status: "prospective"|"active"|"ended"|"terminated",
  startDate, endDate|null,
  rentSchedule: [ { dueDate, amount, currency, status: "scheduled"|"paid"|"overdue"|"waived", paymentId } ],
  deposit: { amount, currency, heldAt, releasedAt, refundedAmount },
  notice: { givenBy, givenAt, moveOutDate }|null,
  audit, deletedAt
}
```

### 4.5 `payments`

```jsonc
{
  _id, tenancyId, propertyId, unitId,
  payerId, payeeId, createdBy,
  kind: "rent"|"deposit"|"late_fee"|"refund"|"service_fee",
  amount: { amount, currency },
  status: "pending"|"requires_action"|"succeeded"|"failed"|"refunded"|"partially_refunded",
  dueDate, paidAt|null,
  method: "card"|"bank"|"manual",
  stripe: { paymentIntentId, clientSecret } | null,
  receiptKey: string|null,            // S3 receipt PDF
  idempotencyKey: string,             // unique
  audit
}
```

### 4.6 `maintenance_requests`

```jsonc
{
  _id, propertyId, unitId, tenancyId|null,
  reportedBy: ObjectId, assignedTo: ObjectId|null,
  title, description,
  category: "plumbing"|"electrical"|"hvac"|"appliance"|"structural"|"other",
  urgency: "low"|"normal"|"high"|"emergency",
  priority: "low"|"medium"|"high"|"critical",   // AI‑triaged
  status: "open"|"accepted"|"in_progress"|"waiting_parts"|"resolved"|"closed",
  media: [{ key, variant }],
  timeline: [ { at, by, event, note } ],
  sla: { dueAt, breachedAt|null },
  cost: { approvedAmount, actualAmount, currency }|null,
  rating: { score, comment }|null,              // tenant rating
  audit
}
```

### 4.7 `conversations` & `messages`

```jsonc
// conversations
{
  _id, participants: [ObjectId],                 // indexed
  context: { type: "tenant_owner"|"buyer_agent"|"maintenance"|"direct", refId? },
  lastMessageAt, unreadCounts: { userId: count },
  status: "active"|"archived"
}
// messages
{
  _id, conversationId: ObjectId, senderId,        // TTL on conversationId
  body, attachments: [{ key, kind }],
  clientId,                                      // optimistic dedupe
  readBy: [ { userId, at } ],
  createdAt
}
```

---

## 5. Reference vs. Embed Decision Table

| Data                    | Decision                | Reason                             |
| ----------------------- | ----------------------- | ---------------------------------- |
| Property amenities      | Embed                   | Small, always loaded with property |
| Listing media summary   | Embed                   | Needed on every card/detail render |
| Tenancy rent schedule   | Embed                   | Immutable snapshot of the cycle    |
| Messages                | Separate collection     | High volume, pagination, TTL       |
| Payments                | Separate collection     | Queried/reported independently     |
| User profile in listing | Reference + denormalize | Name/avatar summary on listing     |
| Maintenance timeline    | Embed                   | Bounded audit trail within ticket  |

---

## 6. Relationships & Integrity

- Relationships are **references + app‑level validators** (no DB foreign keys).
- Unique indexes enforce uniqueness (`email`, `slug`, `{userId,listingId}` favorites, `idempotencyKey`).
- **Tenant isolation:** every tenant‑scoped query filters by `tenantIds`/`payerId` in the repository layer — never trusted from client input.
- Denormalized counters (occupancy, favorites, views) are updated transactionally inside the same service that mutates the source, then reconciled by nightly jobs.

---

## 7. Indexing Strategy

- **Hot reads:** `users.email`, `listings.{status, publishedAt}`, `properties.{ownerId,status}`, `payments.{tenancyId,status}`.
- **Geo:** `properties.location`, `listings.location` → `2dsphere`.
- **Search mirror:** Meilisearch holds the queryable copy; Mongo geo indexes back up proximity search when Meilisearch is degraded.
- **Analytics:** `analytics_daily.{metricKey,day}` unique; events partitioned by day via TTL.
- **TTL indexes:** refresh tokens, reset/OTP tokens, notifications (keep window), ai cache.
- **Concurrency:** bookings use slot documents with optimistic concurrency (version field) to prevent double‑booking.

---

## 8. Search Index (Meilisearch) Mapping

| Meilisearch field                   | Source                          | Type                    |
| ----------------------------------- | ------------------------------- | ----------------------- |
| `id`                                | listing `_id`                   | searchable (id)         |
| `title` / `description`             | listing                         | full‑text               |
| `type`, `beds`, `baths`, `areaSqFt` | listing                         | filter                  |
| `priceAmount`, `currency`           | listing.price                   | sort + filter           |
| `amenities`                         | listing.amenities               | facet                   |
| `location`                          | listing.location                | geoPoint                |
| `status`                            | listing.status                  | filter (published only) |
| `city`, `neighborhood`              | property.address (denormalized) | facet                   |

---

## 9. Migrations & Seeding

- **Migrations:** a `migrations/` folder in `packages/database`; each migration is an idempotent script (up/down), run in order on deploy (and recorded in a `migrations` collection).
- **Seeds:** `seed/prod‑demo.js`, `seed/staging.js` — create Super Admin, sample owners/agents, properties, units, listings, tenancies, and payments.
- **Backfill:** `search:reindex` CLI for Meilisearch; `analytics:rollup` for daily metrics.

---

## 10. Backup & Retention

- MongoDB Atlas continuous backups + PITR; weekly restore drill to a scratch cluster.
- Object storage versioning + lifecycle (thumbnail tier → cold storage).
- `notifications` and `messages` retention windows via TTL; audit logs kept indefinitely (append‑only).
