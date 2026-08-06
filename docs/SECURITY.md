# PropertyPro — Security Best Practices

**Version:** 1.0 · **Related:** [ROLES.md](./ROLES.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md)

**Threat model basis:** OWASP Top 10 (2021) adapted for a multi‑tenant SaaS with payments and PII.

---

## 1. Authentication & Session Security

- **Passwords:** bcrypt (cost 12+) / argon2id; never stored in plain text or reversible form.
- **Access token:** JWT, 15‑min lifetime, held **in memory** on the SPA (not localStorage → not XSS‑readable). Claims: `{ sub, roles, type:"access", iat, exp }`.
- **Refresh token:** opaque 256‑bit random, stored **hashed (SHA‑256)** in DB, delivered via **HttpOnly · Secure · SameSite=Lax** cookie. 30‑day expiry with absolute max lifetime.
- **Rotation + reuse detection:** every refresh rotates the token; reusing a rotated/revoked token revokes the whole session family and fires a security alert.
- **Email verification** required before privileged actions.
- **Password reset:** OTP via email + short‑lived token; forces re‑login on all devices.
- **MFA (v1.1):** TOTP enforced for `admin`, optional for `owner`; recovery codes.
- **Suspension/role changes** revoke sessions at refresh time and are re‑validated on sensitive routes.

---

## 2. Authorization

- Layered: **authenticate → authorize(role) → resolveResource → assertAccess(owner/scope) → serializeByRole** (see [ROLES.md](./ROLES.md)).
- Ownership checks in the **service/repository layer**, never client‑supplied IDs trusted blindly.
- **Tenant isolation:** all tenant‑scoped queries filter by the authenticated user's scope; enforced in repositories (defense in depth — UI and middleware are not the boundary).
- Field‑level masking in the serializer prevents data leakage even on authorized endpoints.
- Admin mutations require re‑authentication and are always audited.

---

## 3. Input Validation & Injection

- **Zod schemas** validate every body/query/param; shared schemas also power frontend forms (single source of truth).
- **No raw query building** — Mongoose/Mongo drivers with typed filters only; never string‑interpolated.
- MongoDB injection is neutralized by typed filters + validation; still, no user input reaches query operators unvalidated.
- **No‑SQL injection checks:** reject `$`‑prefixed keys in body paths; sanitize projection/sort fields against an allowlist.
- Body size limits; JSON‑only content type; strict MIME checks on uploads.

---

## 4. Secrets & Configuration

- Secrets via environment variables or a secret manager (never in code, never committed).
- `.env.example` documents all variables; boot fails fast if required secrets missing (except in local dev).
- JWT secrets: ≥ 256‑bit random; rotated on compromise with dual‑key acceptance window.
- No secrets in logs, error responses, or analytics events; structured logging scrubs sensitive fields.
- Client bundle contains zero secrets (server‑only keys never reach `apps/web`).

---

## 5. Transport & Headers

- **TLS 1.2+** everywhere; HSTS with preload; secure cookies.
- `helmet` headers: CSP (strict, nonce for inline), X‑Content‑Type‑Options, X‑Frame‑Options (DENY), Referrer‑Policy, Permissions‑Policy.
- **CORS:** explicit origin allowlist; credentials only for configured domains; no wildcard with cookies.
- CSRF: SameSite cookies + double‑submit token or custom header checks for state‑changing requests (defense in depth).

---

## 6. Payments & Financial Data

- **PCI scope:** PropertyPro never touches, stores, or logs raw card data. Card entry via Stripe Elements/Checkout; only tokenized references stored.
- Stripe webhooks: **signature verification** (HMAC) + idempotency keys; replay/duplicate protection.
- Idempotency‑Key required on charge/refund/confirm endpoints; nightly reconciliation job compares ledger ↔ Stripe.
- Money values: integer minor units; currency codes validated; rounding handled server‑side only.
- Refunds and deposit release require authorization + audit entry.

---

## 7. File Upload Security

- Allowlisted MIME types + extension checks + **magic‑byte sniffing**; size caps (image 15 MB, doc 25 MB).
- Client‑side recompression for images; virus scan hook on completion (private queue, quarantine on detection).
- Object keys are server‑generated (never user path input); private bucket default; signed URLs with short TTLs and scope.
- Documents (leases, IDs) stored encrypted at rest (SSE‑KMS) and served only via signed download links with ownership checks.

---

## 8. Rate Limiting & Abuse

- Tiered rate limits (see [API.md](./API.md) §16): public browse, authenticated, auth, AI, uploads, webhooks (IP allowlist).
- Account‑level limits (e.g., max listings, media quota) enforced server‑side.
- Login/OTP throttling + lockout backoff; captcha (Turnstile) on auth forms (v1.1).
- Audit + alerting on anomaly patterns (mass scraping, signup bursts, refund abuse).

---

## 9. Logging, Audit & Monitoring

- Structured JSON logs (Pino) with request IDs; correlation across API/jobs/realtime.
- **Audit log (append‑only):** privileged ops — role changes, suspensions, refunds, deletions, admin actions — capture `{ actor, action, target, before, after, ip, userAgent, at }`.
- Audit collection protected from app‑level writes (middleware forbid); export available to admins.
- Sentry error tracking (PII scrubbed); alerts on auth/abuse thresholds; uptime + health checks (`/healthz`, `/readyz`).

---

## 10. Data Protection & Privacy (GDPR/CCPA‑ready)

- **Data minimization:** collect only required fields; retention policies on tokens, notifications, raw events.
- **Right to access/export:** per‑user data export (JSON) endpoint.
- **Right to erasure:** self‑service anonymization (`DELETE /users/me`) + admin‑assisted deletion; references rewritten to "deleted user" placeholders.
- Consent flags for marketing/email; preference center per channel.
- Encrypted at rest for DB (Mongo Atlas encryption) and object storage.
- PII is never sent to third‑party AI providers without scrubbing; AI contexts are tenant‑scoped.

---

## 11. Dependency & Supply‑Chain

- Dependabot/Renovate for automated updates; `pnpm audit` + `npm audit` in CI with fail‑on‑high.
- Lockfile committed; reproducible installs; peer‑dependency hygiene.
- Container images: minimal base (distroless/node slim), non‑root runtime, image signing (v1.1), scan in CI (Trivy).

---

## 12. Hardening Checklist (release gates)

- [ ] TLS + HSTS + CSP active; no inline scripts without nonce.
- [ ] All secrets externalized; `.env.example` current; no secrets in git history.
- [ ] Dependency audit clean (high+); container scan clean.
- [ ] All endpoints validated with Zod; no raw operators from user input.
- [ ] RBAC + ownership + serializer tests cover every privileged route.
- [ ] Rate limits configured; webhook signature verification in place.
- [ ] PCI checklist: no raw card data anywhere in app logs/DB/cache.
- [ ] Audit logging wired for all admin/money/role mutations.
- [ ] `axe` a11y scan + manual keyboard pass (security of data via a11y: no hidden data disclosure).
- [ ] Backup restore drill passed; incident runbook documented.

---

## 13. Incident Response

1. Detect (Sentry/alerts/audit anomalies) → 2. Triage (severity: data, money, availability) → 3. Contain (revoke sessions, disable flags, rate‑limit harder) → 4. Eradicate (patch, rotate secrets) → 5. Recover (restore, reconcile ledger) → 6. Postmortem (root cause, owner, timeline, prevent recurrence).

**Responsible disclosure:** security contacts documented in the repo; report path in README.
