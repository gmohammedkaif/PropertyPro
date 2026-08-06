# PropertyPro — UI & UX Guidelines

**Version:** 1.0 · **Related:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [PRD.md](./PRD.md)

---

## 1. Design Vision

**Modern · Premium · Minimal.** PropertyPro feels like Linear, Stripe, Notion, and Airbnb — polished, calm, and instantly usable. Every screen earns its elements; nothing decorative survives without a job.

**Keywords:** glassmorphism, soft shadows, floating cards, rounded corners, generous whitespace, micro‑interactions, perfect spacing, elegant charts, Apple‑quality finish.

---

## 2. Core UX Principles

1. **Clarity over cleverness.** The primary action on any screen is self‑evident.
2. **Speed is a feature.** Sub‑3s perceived load; skeletons over spinners; optimistic updates.
3. **Progressive disclosure.** Detail reveals as needed (accordions, tabs, drawers) — no walls of forms.
4. **Consistent mental models.** Same component = same behavior everywhere.
5. **Zero‑data moments matter.** Empty states teach the next step instead of showing a void.
6. **Keyboard first.** Power users navigate everything without a mouse.
7. **Accessibility is non‑negotiable.** WCAG 2.2 AA; reduced‑motion respected.
8. **One source of truth.** State in URL for shareable filters; server cache via TanStack Query.

---

## 3. Page Structure

### 3.1 Public (marketing/browse)

- Sticky glass navbar → hero (value prop + search) → featured listings → how‑it‑works → pricing → footer.
- Browse: toolbar (search + filters) → results grid (cards) with faceted sidebar (mobile: bottom sheet).

### 3.2 Authenticated shell

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │  Navbar (search ⌘K · create · bell · avatar) │
│ (collapse)│──────────────────────────────────────────────│
│          │  Breadcrumb + page header (title, actions)    │
│          │  Content (Outlet)                             │
│          │  Persistent footer actions (sticky save bars) │
└──────────┴──────────────────────────────────────────────┘
```

---

## 4. Layout & Spacing

- **Grid:** 12‑column (≥1200px), 8‑column (768–1199px), 4‑column (<768px); consistent 8‑point spacing system.
- **Card paddings:** 16 / 20 / 24 px by density; page gutters 24–32 px desktop, 16 px mobile.
- **Max content width:** 1200 px; dashboards up to 1440 px.
- **Sticky elements:** navbar, sidebar, table headers, and form save bars — never floats that block content.
- **Floating cards:** overlapping glass panels on heroes and auth screens (blur + soft shadow + 1px highlight border).

---

## 5. States Every View Must Handle

| State               | Pattern                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Loading**         | Skeleton blocks matching final layout (never spinners alone)                        |
| **Empty**           | Illustration + one‑line explanation + primary CTA (e.g., "Add your first property") |
| **Error**           | Friendly title + actionable message + **Retry** button                              |
| **Success**         | Toast confirmation; optimistic UI where safe                                        |
| **Partial/offline** | Banner + degraded controls (search fallback, queue indicators)                      |

Enforced via a shared `<QueryBoundary>` wrapper used by all data views.

---

## 6. Navigation & Interaction

- **Global search** ⌘K / Ctrl‑K command palette (listings, properties, actions, people).
- **Sidebar:** section groups with role filtering; collapses to icon rail; active state = accent pill + micro‑slide.
- **Deep links:** every row/list item navigates to a stable URL; back buttons behave predictably.
- **Undo/redo** for destructive‑adjacent actions (delete favorite, archive thread).
- **Confirmations** only for irreversible/paid actions; otherwise optimistic + undo toast.
- **Empty‑input affordances:** typeahead, masked inputs (phone, money), auto‑formatting.

---

## 7. Forms

- Single primary submit; validation inline on blur; errors adjacent to fields.
- Progressive wizard for multi‑step (listing publish: Details → Media → Pricing → Review).
- Autosave drafts (listing wizard, chat) with "Saved" indicator.
- Disable submit while in‑flight; show progress on long tasks.
- Money/date/time inputs use dedicated formatted components.

---

## 8. Data & Tables

- Sortable, filterable columns; sticky header; row actions via kebab menu.
- Pagination: infinite scroll for discovery; numbered pages for management tables.
- Numeric alignment (tabular figures) for money/statistics.
- Skeleton rows while loading; empty table state with CTA.
- Export actions (CSV/PDF) always discoverable in headers.

---

## 9. Charts & Dashboards

- KPI stat cards with sparkline trend + delta badges (▲/▼ with color).
- Charts: Area (revenue trend), Donut (occupancy/status mix), Bar (monthly payments), Funnel (listing conversion), Heatmap (demand by area, v1.1).
- Tooltips show exact values; legends accessible; charts adapt to dark mode.
- Every metric labels its period and units; no chart without context.

---

## 10. Motion & Micro‑interactions (guidelines)

- **Durations:** 100–200 ms for micro; ≤300 ms for panels; staggered lists ≤450 ms total.
- **Hover:** card lift (translateY −2px + shadow deepen, 150 ms); button tint; link underline slide.
- **Focus:** visible 2px ring using `--color-focus`; never removed without replacement.
- **Enter/exit:** fade + translate‑Y(8px) + slight scale for modals/drawers with overshoot spring.
- **Respect `prefers-reduced-motion`:** disable transforms/springs; keep only opacity.
- **Purpose‑driven:** motion signals hierarchy (which panel opened, where data appeared), never decoration.

---

## 11. Empty States & Onboarding

- First‑run: personalized checklist per role (owner: add property → publish listing; buyer: save a search).
- Tutorial hotspots (once), keyboard shortcuts sheet (⌘K → "?").
- Progress‑based nudges ("3 of 5 steps to your first listing").

---

## 12. Accessibility Requirements

- Semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`).
- All interactive elements reachable + operable via keyboard; visible focus.
- ARIA labels on icons; `aria-live` on toasts/badges; `role=dialog` on modals with focus trap.
- Color contrast ≥ 4.5:1 (text) / 3:1 (large text & UI) in both themes.
- Touch targets ≥ 44×44 px; tap states; swipe gestures mirrored by buttons.
- Alt text on media; captions for video (none in v1); reduced‑motion support.
- Screen‑reader audits in CI (axe‑core on key routes).

---

## 13. Copy & Tone

- **Clear, warm, confident.** Active verbs; short sentences; avoid jargon.
- Buttons: "Add property", "Publish listing", "Pay rent now" — verb + noun.
- Errors: what happened + how to fix ("Check your email and try again.").
- Notifications: human, actionable, scoped ("Your viewing with Alec is confirmed for Thu 10:00.").
- Microcopy everywhere: placeholders, helper text, empty states, confirmation text.

---

## 14. Responsive Behavior

| Breakpoint | Behavior                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------- |
| ≥1024px    | Full sidebar, multi‑column grids, inline forms                                                      |
| 768–1023px | Collapsed sidebar (icon rail), 2‑col grids, stacked stats                                           |
| <768px     | Bottom navigation or hamburger, single column, sheets for filters/facets, sticky bottom action bars |

- Touch‑first on mobile: larger inputs, thumb‑reachable primary actions.
- Images: responsive `srcset`, lazy load, blur‑up placeholders.
- Test matrix: Chrome/Safari/Firefox, iOS/Android, 320px min width.

---

## 15. Quality Bar

- Lighthouse ≥ 90 (Performance/A11y/Best Practices/SEO) on core routes.
- No layout shift on async content (fixed‑size skeletons).
- Consistent 8‑pt spacing; no pixel‑level drift between screens.
- Storybook covers every state of every component.
- E2E (Playwright) covers: auth, browse→book, rent payment, maintenance, admin flows.
