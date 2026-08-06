# PropertyPro — Deployment Strategy

**Version:** 1.0 · **Related:** [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md)

---

## 1. Environments

| Env            | Purpose                         | Data                                        | URL                        |
| -------------- | ------------------------------- | ------------------------------------------- | -------------------------- |
| **Local**      | Developer loop (docker compose) | Local Mongo/Redis/MinIO/Meilisearch + seeds | `localhost:5173` / `:4000` |
| **Staging**    | Pre‑production validation       | Clone of prod shape, anonymized demo data   | `staging.propertypro.app`  |
| **Production** | Live                            | Real data, backups                          | `propertypro.app`          |

Every environment is provisioned as code; `npm run env:doctor` validates required env vars before boot.

---

## 2. Container Topology

```
                       ┌─────────────────────────────┐
                       │  CDN / Edge (static SPA)    │
                       │  Cloudflare Pages / Vercel  │
                       └──────────────┬──────────────┘
Load balancer / TLS ───────────────────┼──────────────► /api/v1 → API app
                              ┌────────▼────────┐
┌─────────────────────────────┤  API (Express)  ├─────────────────┐
│                             └───────┬─────────┘                 │
│   horizontal scale (stateless)      │                           │
└──────┬───────────────────────┬──────┴─────┬─────────────────────┘
       ▼                       ▼            ▼
  MongoDB Atlas          Redis Cloud    R2 / S3 (media)
  (+ replicas, PITR)   (+ BullMQ)       (+ CDN, virus scan)
       │
       ▼
 Meilisearch Cloud    Stripe (webhooks)   Email (Resend/Postmark)
```

**Services as managed cloud:** MongoDB Atlas, Redis Cloud, R2/S3, Meilisearch Cloud, Stripe, Resend/Postmark, Mapbox, Sentry — chosen to minimize self‑management and guarantee uptime.

---

## 3. Images & Containers

- `apps/api` → minimal Node 20 slim image, non‑root user, healthcheck (`/healthz`).
- `apps/web` → static build artifact served by the edge/CDN (no Node runtime in prod for the client).
- Trivy image scan in CI; `~/.npmrc`-less reproducible installs via locked pnpm.
- `docker-compose.yml` for local: `api`, `mongo`, `redis`, `meilisearch`, `minio`, `mailhog`.

---

## 4. CI/CD Pipeline (GitHub Actions)

```
Push / PR
  ├─ lint (eslint) + format (prettier)
  ├─ typecheck (tsc --noEmit)
  ├─ unit tests (Vitest) + coverage gate
  ├─ dependency audit (pnpm audit fail-on=high)
  ├─ build (api image + web bundle)
  └─ e2e (Playwright) on preview environment
         │
         ▼  on merge to main
Preview deploy (staging) → smoke tests → manual release
         ▼
Promote → production deploy → health smoke → rollback ready
```

- **Branches:** feature → `main`; releases tagged `vX.Y.Z` (conventional commits + changelog).
- **Staging deploy** on every merge; **production** via labeled release workflow (gate on staging green).
- Blue‑green / rolling for the API (no downtime); static app is atomic (instant CDN swap).

---

## 5. Deployment Steps (Production)

1. CI builds + scans images, runs tests.
2. Migrations (idempotent) run as a pre‑release step against a migration lock.
3. Blue/green swap API instances; run migration backwards‑compat window before pruning old version.
4. Web bundle deployed to CDN with cache‑busted assets; sitemap + prerendered landing updated.
5. Smoke checks: `/healthz`, `/readyz`, critical API slice (auth, search, payments config), web TTFB.
6. Rollback plan: redeploy previous green image; DB migrations are backward‑compatible by design.

---

## 6. Database & Data Ops

- MongoDB Atlas: replicas (multi‑AZ), continuous backups + PITR, weekly **offsite restore drill** to a scratch cluster.
- Index/aggregation maintenance run in maintenance window; no locks during peak.
- Object storage: versioning enabled; lifecycle (thumbnails → cold tier); bucket policies restrict public access (media via CDN cache, docs private).

---

## 7. Observability & Monitoring

| Tool               | Use                                                                    |
| ------------------ | ---------------------------------------------------------------------- |
| Pino + request IDs | Structured app logs                                                    |
| Sentry             | Error tracking + performance monitoring (PII scrubbed)                 |
| OpenTelemetry      | Traces API → DB → jobs → providers                                     |
| Grafana/Loki       | Dashboards: latency (P50/P95/P99), error rate, queue depth, occupancy  |
| Uptime monitors    | External checks on landing + `/healthz` + payment webhook availability |
| Alerts             | Page on SRE on: error rate, deploy, auth‑anomaly, queue backlog, disk  |

**Key SLOs:** P95 API < 300 ms; error rate < 0.5%; uptime 99.9%; search < 150 ms.

---

## 8. Backup & Recovery

| Asset                             | Cadence                          | RPO        | RTO       |
| --------------------------------- | -------------------------------- | ---------- | --------- |
| MongoDB (Atlas continuous + PITR) | Continuous + daily point‑in‑time | ≤ 5 min    | ≤ 30 min  |
| Object storage (versioning)       | Real‑time                        | ≤ 1 change | Immediate |
| Redis (queues)                    | Restart‑replay + durable jobs    | —          | ≤ 15 min  |
| Config/feature flags              | Git‑versioned                    | —          | Immediate |

**Restore drill:** monthly automated restore to scratch cluster + verification of key datasets; documented runbook.

---

## 9. Scaling Path

- **Phase A (launch):** single API instance behind LB; managed Mongo/Redis; edge‑cached static app.
- **Phase B (growth):** horizontal API replicas; read replicas; tiered caching; job concurrency tuning.
- **Phase C (scale):** extract search & payments as standalone services; Kubernetes (EKS) with HPA; multi‑region active‑passive; feature‑flag driven canary releases.

---

## 10. Security Controls in Deploy

- TLS everywhere (edge + internal service mTLS optional); HSTS.
- Secrets via secret manager / CI‑injected env; never in build artifacts or client bundle.
- Reproducible, pin‑locked builds; container non‑root; image signatures (v1.1).
- Webhook endpoint behind network policy + signature verification; admin routes behind stricter rate limits.
- Deployment audit entries in `audit_logs` (who, what, when).

---

## 11. Governance & Rollback

- **Release manager:** only tagged, CI‑green builds deploy to production.
- **Feature flags** gate risky features independently of code deploys (kill‑switch in seconds).
- **Rollback trigger criteria:** p95 > 500 ms × 5 min, error rate > 1%, payment webhook drift, security events.
- Post‑deploy: automatic smoke + alert watch for 15 min; on‑call acknowledge.
