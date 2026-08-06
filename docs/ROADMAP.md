# PropertyPro — Development Roadmap

**Version:** 1.0 · **Related:** [PRD.md](./PRD.md), [FEATURES.md](./FEATURES.md)

---

## 1. Guiding Principles

- **Vertical slices:** each phase ships a working end‑to‑end user story, not isolated layers.
- **Design system first:** all UI is built on tokens + components from `packages/ui`, so features never improvise styles.
- **Contract‑first:** API schemas in `packages/shared` are defined before both frontend and backend build against them.
- **Tests with every slice:** unit (Vitest) + e2e (Playwright) behind feature flags.
- **Shippable at every phase end.**

---

## 2. Milestone Map

| Phase  | Theme                 | Duration     | Exit criteria                                                                |
| ------ | --------------------- | ------------ | ---------------------------------------------------------------------------- |
| **P0** | Foundation            | Weeks 1–2    | Monorepo builds, CI green, design‑system core, auth + RBAC, admin can log in |
| **P1** | Property core         | Weeks 3–5    | Property/unit + listing lifecycle, media upload, search, browse UI           |
| **P2** | Transactions          | Weeks 6–9    | Bookings, tenancies, leases, Stripe payments, rent cycle, notifications      |
| **P3** | Operations            | Weeks 10–12  | Maintenance board, chat, notifications depth, analytics, admin console       |
| **P4** | Intelligence + polish | Weeks 13–15  | AI features, dark‑mode depth, a11y audit, e2e suite, performance pass        |
| **P5** | Scale                 | v1.x ongoing | MFA, push, multi‑currency, micro‑service extraction, enterprise hardening    |

---

## 3. Phase P0 — Foundation (Weeks 1–2)

**Goals:** every later phase builds on a stable, typed, testable base.

**Deliverables**

- pnpm monorepo: `apps/web`, `apps/api`, `packages/{ui,shared,config,database}`.
- ESLint + Prettier + strict TSConfig presets in `packages/config`; Husky pre‑commit.
- CI pipeline (GitHub Actions): lint → typecheck → unit → build.
- Design tokens (light/dark) + core component set in `packages/ui` + Storybook.
- App shells: public site, auth screens, `AuthGuard` + `RoleGuard`, dashboard layout (sidebar/navbar).
- API boot: config, logger (Pino), Mongo + Redis connect, error handler, health endpoints.
- Auth module: register/verify/login/refresh/logout/reset + RBAC middleware.
- DB models for `users`, tokens, audit log; seed for Super Admin.

**Exit criteria:** a Super Admin can register→verify→log in→see an empty dashboard; CI is green; Storybook renders core components.

---

## 4. Phase P1 — Property Core (Weeks 3–5)

**Deliverables**

- Properties & units CRUD; geo location; occupancy counters.
- Listing publishing wizard (draft → preview → published) with media.
- Presigned‑URL upload flow incl. image resize + blur‑up placeholders.
- Meilisearch index + write‑through sync; faceted/geo search UI with infinite scroll.
- Public browse + listing detail pages; favorites + saved searches.
- Listing analytics counters (views, favorites).

**Exit criteria:** an owner uploads a property, publishes a listing with photos, and a buyer finds it via faceted search, favorites it, and opens detail.

---

## 5. Phase P2 — Transactions (Weeks 6–9)

**Deliverables**

- Booking flow with availability slots + optimistic locking; reminder chain.
- Tenancy lifecycle (prospective → active → ended) + rent schedule generation.
- Lease documents (create, e‑sign, PDF export via signed URL).
- Stripe integration: PaymentProvider interface, PaymentIntent flow, webhooks (verified, idempotent), receipts.
- Rent cycle: pay, reminders, late fees, refunds/deposit release.
- In‑app notifications + transactional email (verification, receipts, reminders).
- Realtime (Socket.io) for booking/notification updates.

**Exit criteria:** a tenant pays rent through Stripe, receives a receipt, and a booking is accepted — all with notifications and audit trail.

---

## 6. Phase P3 — Operations (Weeks 10–12)

**Deliverables**

- Maintenance board: create, AI triage, assign, SLA timers, status workflow, ratings.
- Chat: conversations, threaded messages, typing, presence, read receipts.
- Analytics: role‑aware dashboards, revenue/occupancy/maintenance/funnel charts (Recharts), CSV/PDF exports.
- Admin console: users & roles, audit‑log viewer, feature flags, announcements, platform stats.
- Settings: profile, preferences, billing, security (session management).

**Exit criteria:** full multi‑role operations — a tenant files a ticket, staff resolves it, owner sees MTTR analytics; admin manages roles and flags.

---

## 7. Phase P4 — Intelligence & Polish (Weeks 13–15)

**Deliverables**

- AI: listing description generator, valuation estimator, maintenance triage, tenant copilot (RAG).
- Search UX polish: facets, "search this area", autocomplete (⌘K), saved‑search alerts.
- Accessibility audit against WCAG 2.2 AA; keyboard/focus/reduced‑motion pass.
- Performance pass: route code‑splitting, image optimization, Lighthouse ≥ 90.
- e2e test suite (Playwright) covering critical journeys.
- Dark‑mode depth + glassmorphism/framer‑motion final pass; loading/empty/error states audit.

**Exit criteria:** release candidate — Lighthouse ≥ 90, a11y AA, e2e green, all core journeys polished.

---

## 8. Phase P5 — Scale (v1.x Ongoing)

**Backlog (prioritized by demand)**

- MFA (TOTP) + recovery codes; enforce for admin.
- Web push notifications; rich email digests.
- Multi‑currency + non‑Stripe rails (Adyen/Razorpay) behind the provider interface.
- Marketplace for maintenance vendors; booking payments.
- Mobile native (React Native/Expo) or PWA install flow.
- Localization (i18n) activation; regional tenancy/lease templates.
- Extract high‑traffic services (search, payments) to standalone deployables.
- Kubernetes for horizontal scale; Blue/Green deploys.

---

## 9. Risks & Mitigations

| Risk                                 | Impact                  | Mitigation                                                  |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------- |
| Scope creep before vertical slices   | Late, unstable launches | Phase exit criteria are fixed; anything new goes to backlog |
| Design inconsistency across features | Regressions             | All UI via `packages/ui`; design‑system lint rules          |
| Payment webhook drift                | Failed rent             | Idempotency keys + nightly reconciliation job               |
| AI cost/abuse                        | Budget blow‑up          | Rate limits, caching, prompt guards, per‑tenant quotas      |
| Mongo query degradation at scale     | Slow reads              | Index‑first rule + aggregation rollups + read replicas      |
| Solo/small team capacity             | Throttled velocity      | Vertical slices keep every deploy valuable; strict CI gates |

---

## 10. Definition of Done (every item)

- Code merges only with lint + typecheck + unit tests green.
- Vertical slice demoable in dev against seeded data.
- No `any`, no dead code, no unguarded routes.
- Loading/empty/error states present; keyboard + reduced‑motion respected.
- Any mutation of money/roles append to audit log.
- Docs updated where behavior changed.
