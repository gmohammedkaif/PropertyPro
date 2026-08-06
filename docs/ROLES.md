# PropertyPro — Users, Roles & Authorization

**Version:** 1.0 · **Related:** [API.md](./API.md), [SECURITY.md](./SECURITY.md), [PRD.md](./PRD.md)

---

## 1. User Model

A user has one account with **one or more roles**:

```jsonc
{
  email, passwordHash,
  roles: ["buyer", "tenant", "owner", "agent", "maintenance", "admin"],
  profile: { firstName, lastName, avatarKey, bio, locale, timezone },
  status: "pending_verification" | "active" | "suspended",
  preferences: { theme, notifications }
}
```

**Role composition rules:**

- `owner` and `agent` may coexist (a person who owns property and sells for others).
- `tenant` is set by the tenancy lifecycle, not chosen at signup.
- `maintenance` is assigned by an owner/admin.
- `admin` is granted only by another admin and is always audited.
- Buyers are the default role at registration.

---

## 2. Role Catalog & Capabilities

| Role                                  | Description              | Core capabilities                                                                                                   |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Super Admin** (`admin`)             | Platform operator        | Everything + role management, audit logs, feature flags, announcements, platform analytics, tenant moderation       |
| **Property Owner** (`owner`)          | Owns/manages real estate | Property & unit CRUD, leasing, tenant onboarding, rent collection, maintenance approvals, reports, staff assignment |
| **Real‑Estate Agent** (`agent`)       | Sells/lets for owners    | Listing publishing wizard, lead inbox, viewing scheduling, listing analytics, buyer CRM                             |
| **Buyer** (`buyer`)                   | Marketplace consumer     | Search, filters, saved searches, favorites, booking viewings, AI valuation, mortgage calculator, messaging          |
| **Tenant** (`tenant`)                 | Rents a unit             | Pay rent, receipts, maintenance tickets, chat with landlord, lease documents, notices, move‑out                     |
| **Maintenance Staff** (`maintenance`) | Field/vendor worker      | Ticket inbox, status workflow, work logs, parts/cost logging                                                        |

---

## 3. Authentication Flow (Overview)

1. **Register** → email + password → sends verification link (1h TTL). Account is `pending_verification`.
2. **Verify email** → account becomes `active`.
3. **Login** → credentials checked (bcrypt) → issues:
   - **Access token:** JWT, 15 min, in memory (SPA) — claims `{ sub, roles, type:"access" }`.
   - **Refresh token:** opaque random, 30 days, stored **hashed** in DB, delivered as an **HttpOnly, Secure, SameSite=Lax cookie**.
4. **Refresh** → access token renewed with **rotation**: old refresh token revoked, new one issued. **Reuse of a revoked token revokes the entire session family** (compromise detection).
5. **Logout** → revokes refresh token (optionally all devices).
6. **Password reset** → OTP email + time‑limited token; forces re‑login across devices.
7. **OAuth (Google/Apple)** → links identity to the same `users` doc; requires email verification on first link.

**Why not store access token in localStorage?** It would be readable by XSS. Keeping it in memory + refresh cookie maximizes security; the cost is re‑login on full page reload, mitigated by a silent `/auth/refresh` at boot.

---

## 4. Authorization Strategy — RBAC + ABAC

**RBAC** decides _which endpoints_ a role may reach; **ABAC** decides _which records_ a user may touch.

### 4.1 Middleware chain

```
authenticate()          → verifies JWT, loads user, attaches req.user
authorize("owner")      → role gate (single or list, OR semantics)
resolveResource()       → loads the target record(s)
assertAccess("update")  → ownership/scope check → 403 otherwise
serializeByRole()       → strips fields not visible to the caller
```

### 4.2 Ownership & scoping rules

| Resource     | Can manage                                | Can view                         |
| ------------ | ----------------------------------------- | -------------------------------- |
| Property     | owner who created it; admin               | tenant of a unit, admin          |
| Unit         | property owner; admin                     | tenant of that unit              |
| Listing      | creating owner/agent; admin               | everyone (public when published) |
| Tenancy      | owner of property; admin                  | tenant(s) on it                  |
| Payment      | payer, payee; admin                       | those parties                    |
| Maintenance  | reporter, assignee, property owner; admin | same                             |
| Conversation | participants                              | participants                     |
| Notification | recipient                                 | recipient                        |

### 4.3 Field‑level masking

Example serializers:

- **Tenant** viewing an owner profile: no payment info, no other tenants.
- **Owner** viewing a tenant profile: contact + payment history only.
- **Agent** viewing a buyer: no financial details.
- **Admin** sees everything (audited).

Implemented centrally in the serializer layer; never by sprinkling conditions in controllers.

---

## 5. Permission Model (Frontend)

Mirror of backend permissions for UI gating:

```
usePermission("properties:create")       → boolean
<RoleGuard roles={["owner"]}><OwnerPanel/></RoleGuard>
<PermissionGuard permission="payments:refund">
```

Permissions derive from `roles` + resource context at runtime; the API remains the authority — UI gating is UX, not security.

**Route table (authenticated shell):**

| Route              | Roles                       |
| ------------------ | --------------------------- |
| `/app/dashboard`   | All (role‑adaptive)         |
| `/app/properties`  | owner, admin                |
| `/app/listings`    | agent, owner                |
| `/app/tenancies`   | owner, tenant               |
| `/app/payments`    | owner, tenant, admin        |
| `/app/maintenance` | tenant, staff, owner, admin |
| `/app/bookings`    | buyer, agent, owner         |
| `/app/messages`    | All                         |
| `/app/analytics`   | owner, agent, admin         |
| `/app/admin/*`     | admin only                  |

---

## 6. Session Lifecycle

```
Login ──▶ access (15m) + refresh cookie (30d, hashed, rotated)
   │
   ├─ refresh token used → rotate → new pair, old revoked
   ├─ reuse detected     → revoke family + alert (security event)
   ├─ logout / password reset / role change / suspension → revoke all
   └─ idle timeout (SPA) → silent refresh or redirect to login
```

- **Role change** or **suspension** revokes sessions immediately (checked at refresh + enforced at request via fresh `sub`+`roles` lookup for sensitive ops).
- Session invalidation for all devices available in Settings → Security.

---

## 7. MFA (Roadmap v1.1)

- TOTP (authenticator apps) + recovery codes.
- Enforced for `admin`, optional for `owner`.
- `mfaEnabled` flag + encrypted secret; re‑authentication required for privileged actions (payment refund, role change).

---

## 8. Admin Guardrails

- Role/status changes and refunds require **re‑authentication** (password or TOTP).
- Every admin mutation appends an `audit_logs` entry: `{ actor, action, target, before, after, ip, userAgent, at }`.
- Admin cannot self‑remove the last admin account.
- Audit logs are append‑only (collection‑level write protection via Mongoose middleware).

---

## 9. Authorization Edge Cases

| Case                        | Policy                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| Owner also a buyer          | Independent role checks per route                                              |
| Listing published then sold | Under‑offer/sold status still owned by creator                                 |
| Tenancy ended               | Tenant keeps read access to history; no new actions                            |
| Shared tenancy (co‑tenants) | All `tenantIds` have equal access                                              |
| Staff leaving               | Tickets reassigned to owner or pool; staff loses write access                  |
| Suspended user              | Rejected at middleware; sessions revoked; payments still reconcilable by admin |
