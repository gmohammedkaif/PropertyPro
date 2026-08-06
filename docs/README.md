# PropertyPro

**The Complete Real Estate & Property Management Platform**

PropertyPro is an enterprise-grade SaaS platform that unifies the entire real‑estate lifecycle — browse and buy, rent and lease, collect payments, manage maintenance, and drive operations with analytics — for **property owners, real‑estate agents, buyers, tenants, and maintenance staff**, all governed by a single **Super Admin** console.

This is a production‑grade product, not a CRUD demo. Every design and engineering decision prioritizes **scalability, maintainability, security, performance, modularity, accessibility, and outstanding user experience**.

---

## Product at a Glance

- **Owners** manage portfolios, leases, tenant portals, rent collection, and reports.
- **Agents** publish listings, run search/leads, schedule viewings, and analyze performance.
- **Buyers** discover listings, save searches, book viewings, and use the AI valuation/copilot.
- **Tenants** pay rent, file maintenance requests, chat with landlords, and manage documents.
- **Maintenance Staff** work a triaged ticket board with SLA tracking.
- **Super Admin** controls roles, feature flags, announcements, audit logs, and platform analytics.

---

## Technology Stack

| Layer            | Technology                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| **Frontend**     | React 18, TypeScript, Vite, React Router, TanStack Query, Zustand      |
| **UI / Styling** | Radix UI primitives, Tailwind CSS, Framer Motion, design‑token system  |
| **Backend**      | Node.js, Express, TypeScript (modular service architecture)            |
| **Database**     | MongoDB 7 (Mongoose, schema‑validated) + Redis (cache/sessions/queues) |
| **Search**       | Meilisearch (full‑text, faceted, geo)                                  |
| **Realtime**     | Socket.io (notifications, chat, presence)                              |
| **Storage**      | S3‑compatible objects (R2/S3) via presigned URLs                       |
| **Payments**     | Stripe (rent, deposits, subscriptions) behind a provider interface     |
| **AI**           | OpenAI-backed valuation, listing copilot, maintenance triage           |
| **Maps**         | Mapbox GL (+ static map thumbnails)                                    |
| **Email**        | Resend / Postmark with React Email templates                           |
| **Infra**        | Docker, GitHub Actions CI/CD, MongoDB Atlas                            |

**Decision record:** We intentionally chose **React + Express + MongoDB** for broad ecosystem familiarity, rapid iteration velocity, and a document model that fits polymorphic real‑estate entities (properties, units, listings, and role‑scoped users) without rigid joins. Modular boundaries are defined so services can be extracted later without a rewrite.

---

## Repository Layout (Monorepo)

```
propertypro/
├── apps/
│   ├── web/                 # React SPA (design system + feature modules)
│   └── api/                 # Express/TypeScript API (feature modules)
├── packages/
│   ├── ui/                  # Shared design‑system components + tokens
│   ├── shared/              # Shared TS types, Zod schemas, constants
│   ├── config/              # ESLint, TSConfig, Prettier presets
│   └── database/            # Mongoose models, migrations, seeds
├── docs/                    # This documentation set
├── infra/                   # Docker, CI/CD, deployment manifests
└── package.json             # Workspace root
```

---

## Documentation Index

| Document                                 | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| [`README.md`](./README.md)               | This overview and documentation hub                           |
| [`PRD.md`](./PRD.md)                     | Product requirements, personas, scope, success metrics        |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)   | System architecture, flows, and cross‑cutting services        |
| [`DATABASE.md`](./DATABASE.md)           | MongoDB schema design, collections, ER relationships, indexes |
| [`API.md`](./API.md)                     | REST API contract, conventions, endpoints, realtime events    |
| [`ROLES.md`](./ROLES.md)                 | Users, roles, authentication, and authorization strategy      |
| [`FEATURES.md`](./FEATURES.md)           | Full feature catalogue across all roles                       |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Design tokens, component catalogue, accessibility             |
| [`UI_GUIDELINES.md`](./UI_GUIDELINES.md) | UX principles, layout, animation, copy, and states            |
| [`SECURITY.md`](./SECURITY.md)           | Security model, threats, and hardening checklist              |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)       | Environments, CI/CD, observability, backups                   |
| [`ROADMAP.md`](./ROADMAP.md)             | Phase‑by‑phase development plan and milestones                |

---

## Getting Started (Coming After Approval)

1. Install Node.js 20+, MongoDB 7, Redis 7, and Docker.
2. Copy `.env.example` → `.env` and fill in local overrides.
3. `pnpm install && pnpm dev` (or `docker compose up` for the full stack).
4. Run seed scripts to provision a Super Admin and demo data.

> **Status:** Architecture and planning phase. No application code has been generated yet. The documents in this folder define the complete blueprint prior to implementation.

---

## License

All rights reserved. This document set is the internal design foundation for PropertyPro.
