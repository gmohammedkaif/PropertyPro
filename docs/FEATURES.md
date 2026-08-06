# PropertyPro — Feature Catalogue

**Version:** 1.0 · **Related:** [PRD.md](./PRD.md), [API.md](./API.md)

**Priority:** M = Must (v1.0) · S = Should (v1.0) · C = Could (v1.1+) · NFR = Non‑functional

---

## 1. Platform (All Roles)

| ID    | Feature                                              | Priority |
| ----- | ---------------------------------------------------- | -------- |
| PL‑01 | Register / login / logout / password reset           | M        |
| PL‑02 | Email verification                                   | M        |
| PL‑03 | Google & Apple OAuth                                 | S        |
| PL‑04 | MFA (TOTP) + recovery codes                          | C        |
| PL‑05 | Role‑based UI + API authorization                    | M        |
| PL‑06 | Profile & preferences (theme, locale, notifications) | M        |
| PL‑07 | Session management (devices, revoke all)             | S        |
| PL‑08 | In‑app notifications (realtime) + email              | M        |
| PL‑09 | Direct chat (1:1 + context threads)                  | M        |
| PL‑10 | Global search ⌘K                                     | S        |
| PL‑11 | Light / dark / system theme                          | M        |
| PL‑12 | Responsive + accessible UI (WCAG AA)                 | M        |
| PL‑13 | Loading skeletons, empty & error states everywhere   | M        |
| PL‑14 | Audit log viewer (admin)                             | M        |

---

## 2. Buyer & Tenant

| ID    | Feature                                                 | Priority |
| ----- | ------------------------------------------------------- | -------- |
| BT‑01 | Listing search: full‑text, facets, geo, sort            | M        |
| BT‑02 | Listing detail: gallery, amenities, agent, map, contact | M        |
| BT‑03 | Favorites & save searches with price‑drop alerts        | S        |
| BT‑04 | Book viewings against availability                      | M        |
| BT‑05 | AI valuation estimator                                  | S        |
| BT‑06 | Mortgage/affordability calculator                       | S        |
| BT‑07 | Rent payment (card/bank) via Stripe                     | M        |
| BT‑08 | Digital receipts & payment history                      | M        |
| BT‑09 | Lease documents (view, e‑sign, download PDF)            | M        |
| BT‑10 | Maintenance request: create, photos, track, rate        | M        |
| BT‑11 | Landlord/agent chat                                     | M        |
| BT‑12 | Notices (give notice, move‑out date)                    | S        |
| BT‑13 | Tenant copilot (AI Q&A over own docs)                   | C        |

---

## 3. Owner

| ID    | Feature                                          | Priority |
| ----- | ------------------------------------------------ | -------- |
| OW‑01 | Property & unit CRUD with geo/amenities          | M        |
| OW‑02 | Portfolio dashboard: occupancy, revenue, upkeep  | M        |
| OW‑03 | Listing publishing (rent/sale)                   | M        |
| OW‑04 | Tenant onboarding → tenancy → lease flow         | M        |
| OW‑05 | Rent collection: schedule, reminders, late fees  | M        |
| OW‑06 | Refunds & deposit hold/release                   | M        |
| OW‑07 | Maintenance approvals & cost controls            | M        |
| OW‑08 | Assign maintenance staff/vendors                 | M        |
| OW‑09 | Financial reports & tax summary export (CSV/PDF) | M        |
| OW‑10 | AI listing description generator                 | S        |
| OW‑11 | Rent‑to‑Own / flexible terms modules             | C        |

---

## 4. Agent

| ID    | Feature                                                  | Priority |
| ----- | -------------------------------------------------------- | -------- |
| AG‑01 | Listing wizard: details → media → pricing → review       | M        |
| AG‑02 | Listing performance analytics (views→favorites→bookings) | M        |
| AG‑03 | Viewing scheduler & reminders                            | M        |
| AG‑04 | Lead inbox + buyer conversations                         | S        |
| AG‑05 | Duplicate / re‑publish listings                          | S        |
| AG‑06 | Commission & deal tracking                               | C        |

---

## 5. Maintenance Staff

| ID    | Feature                                     | Priority |
| ----- | ------------------------------------------- | -------- |
| MS‑01 | Ticket inbox (own + pool) with priority/SLA | M        |
| MS‑02 | Status workflow + timeline comments         | M        |
| MS‑03 | Work logs & parts/cost entry                | M        |
| MS‑04 | Photo evidence before/after                 | S        |
| MS‑05 | Staff performance & MTTR view (owner/admin) | S        |

---

## 6. Super Admin

| ID    | Feature                                      | Priority |
| ----- | -------------------------------------------- | -------- |
| SA‑01 | User management: search, roles, suspend      | M        |
| SA‑02 | Audit log explorer (append‑only)             | M        |
| SA‑03 | Feature flags (runtime toggles)              | M        |
| SA‑04 | Announcements to segments                    | S        |
| SA‑05 | Platform analytics (MAU, growth, revenue)    | M        |
| SA‑06 | Content moderation (listings, reviews, chat) | S        |
| SA‑07 | Export / GDPR tools (data export, delete)    | S        |

---

## 7. AI Features

| ID    | Feature                                       | Priority |
| ----- | --------------------------------------------- | -------- |
| AI‑01 | Listing description + tag generator           | S        |
| AI‑02 | Market valuation estimator (comparables)      | S        |
| AI‑03 | Maintenance ticket triage (priority + vendor) | S        |
| AI‑04 | Tenant/owner copilot (RAG, tenant‑isolated)   | C        |

---

## 8. Commerce & Integrations

| ID    | Feature                                                           | Priority |
| ----- | ----------------------------------------------------------------- | -------- |
| CM‑01 | Stripe: rent, deposits, subscriptions (PaymentProvider interface) | M        |
| CM‑02 | Receipt generation (PDF)                                          | M        |
| CM‑03 | Recurring/bank‑transfer rails                                     | C        |
| CM‑04 | Multi‑currency                                                    | C        |
| CM‑05 | Google Calendar sync for viewings                                 | C        |
| CM‑06 | Maps (Mapbox/MapLibre) on listing detail + browse                 | M        |
| CM‑07 | Static map thumbnails on cards                                    | M        |
| CM‑08 | S3/R2 media with presigned uploads + image variants               | M        |

---

## 9. Non‑Functional Feature Targets

| NFR                       | Target                     |
| ------------------------- | -------------------------- |
| P95 API latency           | < 300 ms                   |
| Search latency            | < 150 ms                   |
| Lighthouse core routes    | ≥ 90                       |
| Uptime                    | 99.9%                      |
| Accessibility             | WCAG 2.2 AA                |
| Core journey e2e coverage | 100% of P‑0 critical paths |
