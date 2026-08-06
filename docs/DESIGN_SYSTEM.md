# PropertyPro — Design System

**Version:** 1.0 · **Owner:** `packages/ui` · **Related:** [UI_GUIDELINES.md](./UI_GUIDELINES.md)

---

## 1. Philosophy

A **token‑driven** system: one source of truth (CSS custom properties), semantic naming, themeable (light/dark), and accessible by default. Components never hardcode colors/spacing — they reference tokens. All UI ships from `packages/ui` (Radix primitives + Tailwind utilities + Framer Motion), versioned with the monorepo.

---

## 2. Design Tokens

### 2.1 Color (semantic, theme‑aware)

| Token                    | Light     | Dark      | Usage                    |
| ------------------------ | --------- | --------- | ------------------------ |
| `--color-bg`             | `#F7F8FB` | `#0B0D12` | Page background          |
| `--color-surface`        | `#FFFFFF` | `#14161D` | Cards, panels            |
| `--color-surface-2`      | `#F1F3F8` | `#1A1D26` | Nested surfaces, hover   |
| `--color-border`         | `#E8EAF0` | `#262A35` | Hairline borders         |
| `--color-text`           | `#0F172A` | `#F1F5F9` | Primary text             |
| `--color-text-2`         | `#475569` | `#9AA4B8` | Secondary text           |
| `--color-text-muted`     | `#94A3B8` | `#64748B` | Muted/labels             |
| `--color-primary`        | `#4F46E5` | `#8B7CF6` | Brand accent, CTAs       |
| `--color-primary-strong` | `#4338CA` | `#A78BFA` | Hover/pressed            |
| `--color-primary-soft`   | `#EEF2FF` | `#2A2B45` | Accent fills/badges      |
| `--color-success`        | `#0D9488` | `#2DD4BF` | Paid, resolved, positive |
| `--color-warning`        | `#D97706` | `#FBBF24` | Overdue, attention       |
| `--color-danger`         | `#DC2626` | `#F87171` | Errors, destructive      |
| `--color-info`           | `#2563EB` | `#60A5FA` | Information              |
| `--color-focus`          | `#4F46E5` | `#A78BFA` | Focus ring               |

### 2.2 Brand gradient

- Primary CTAs: `linear-gradient(135deg, #4F46E5, #7C3AED)` (dark: `#8B7CF6 → #A78BFA`).

### 2.3 Glassmorphism tokens

```css
--glass-bg: rgba(255, 255, 255, 0.62); /* dark: rgba(20,22,29,.55) */
--glass-border: rgba(255, 255, 255, 0.65); /* 1px hairline */
--glass-blur: 20px;
--glass-shadow: 0 8px 32px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06);
```

### 2.4 Spacing (8‑point scale)

`--space-1:4 · -2:8 · -3:12 · -4:16 · -5:20 · -6:24 · -8:32 · -10:40 · -12:48 · -16:64`

### 2.5 Radius

`--radius-sm:6 · -md:10 · -lg:14 · -xl:20 · -2xl:28 · -full:9999` (cards 16–20, buttons 10–12, pills full).

### 2.6 Shadows

```css
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.07);
--shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.1);
--shadow-xl: 0 24px 64px rgba(15, 23, 42, 0.14);
--shadow-focus: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
```

### 2.7 Motion

```css
--duration-fast: 100ms;
--duration-base: 150ms;
--duration-slow: 250ms;
--duration-xslow: 300ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 2.8 Z‑index scale

`--z-dropdown:1000 · --z-sticky:1100 · --z-overlay:1300 · --z-modal:1400 · --z-toast:1500 · --z-command:1600`

---

## 3. Typography

- **Family:** Inter (variable), with system‑font fallbacks.
- **Base:** `16px`, line‑height 1.6, weight 400.
- **Type scale (clamp where fluid):**

| Token            | Size/Weight   | Use              |
| ---------------- | ------------- | ---------------- |
| `--text-display` | 48/60px · 700 | Hero headlines   |
| `--text-h1`      | 32px · 700    | Page titles      |
| `--text-h2`      | 24px · 600    | Section headers  |
| `--text-h3`      | 20px · 600    | Card titles      |
| `--text-body`    | 16px · 400    | Default text     |
| `--text-sm`      | 14px · 500    | UI, meta         |
| `--text-xs`      | 12px · 500    | Captions, labels |
| `--text-numeric` | tabular‑nums  | Prices, KPIs     |

- **Labels/micro:** uppercase, `letter-spacing: 0.08em`, 12px, `text-muted`.
- Heading tracking: `-0.02em` to `-0.04em` for display.

---

## 4. Component Catalogue

### 4.1 Primitives (Radix‑based, accessible)

`Button` · `IconButton` · `Input` · `Textarea` · `Select` · `MultiSelect` · `Checkbox` · `RadioGroup` · `Switch` · `Slider` (price) · `Avatar` (+AvatarGroup) · `Badge` · `Tooltip` · `Popover` · `DropdownMenu` · `Dialog` · `Sheet` (drawer) · `Tabs` · `Accordion` · `Stepper` · `Progress` · `Toast` (Sonner) · `Skeleton` · `Kbd`

### 4.2 Composites (domain‑ready)

`EmptyState` · `ErrorState` · `QueryBoundary` · `StatCard` (+sparkline) · `Chart` (Area/Donut/Bar/Funnel) · `DataTable` (sort/filter/paginate) · `SearchBar` · `CommandPalette` (⌘K) · `DatePicker` · `DateRangePicker` · `FileUpload` (drag&drop, progress) · `PriceInput` · `MapView` · `MarkerCluster` · `PropertyCard` · `ListingCard` · `BookingSlotGrid` · `PaymentMethodRow` · `MaintenanceTicketCard` · `MessageBubble` · `NotificationItem` · `SidebarNav` · `Topbar` · `Breadcrumbs` · `Pagination`

### 4.3 Component contract (all variants)

Each component exposes:

- **Variants:** `size` (sm/md/lg), `intent` (primary/secondary/ghost/danger/success), `state` (default/hover/focus/disabled/loading), `radius`.
- **Props:** typed; `asChild` where polymorphic; `aria-*` passthrough.
- **Uncontrolled + controlled** where sensible; forwardRef on all interactive primitives.

---

## 5. Buttons & Actions

| Intent      | Use                                       |
| ----------- | ----------------------------------------- |
| `primary`   | Single main action per view (gradient)    |
| `secondary` | Supporting actions (surface + border)     |
| `ghost`     | Tertiary, toolbars, table row actions     |
| `danger`    | Destructive (delete, refund) with confirm |
| `success`   | Confirmations of completed state          |

- Loading: inline spinner + disabled; width preserved (no layout shift).
- Icons: 20px default; icon‑only buttons require `aria-label`.

---

## 6. Forms

- Labels above inputs (12px medium, `text-2`); helper text below (`text-xs muted`).
- Error: red border + inline message + `aria-describedby`.
- Required indicator; character counters on descriptions.
- Success/error states via `aria-invalid` + toast on submit.
- Disabled state: 50% opacity, non‑interactive, still readable.

---

## 7. Feedback & Status

- **Badges:** `success` (Paid, Resolved), `warning` (Overdue, Pending), `danger` (Failed, Critical), `neutral`, `info` (Processing).
- **Toast:** top‑right, stackable, 4s auto‑dismiss (except errors), action button for undo/retry, `aria-live=polite`.
- **Progress:** linear for uploads/wizards; circular for indeterminate.

---

## 8. Data Display

- **StatCard:** label (uppercase micro) + value (tabular) + delta badge + optional sparkline.
- **DataTable:** sticky header, sortable columns (arrows), filter toolbar, kebab row actions, checkbox selection for bulk ops, skeleton rows.
- **Charts (Recharts wrapped):** consistent grid/muted tones; tooltips formatted for currency/units; responsive; dark‑mode aware.

---

## 9. Icons & Imagery

- **Icons:** Lucide set (stroke 2, 20px default) — consistent, license‑friendly.
- **Imagery:** real‑estate photography style; always `alt` text; lazy‑loaded with blur‑up.
- **Emoji:** not used in UI; status conveyed via badges/color.

---

## 10. Dark Mode

- Toggle: `light` / `dark` / `system`; persisted; `class` strategy + `prefers-color-scheme`.
- Tokens flip via `[data-theme="dark"]` overrides — components unchanged.
- Inline boot script prevents theme flash (FOUC).

---

## 11. Accessibility Baseline

- Radix primitives provide role/keyboard/focus‑trap/`aria` behavior by default.
- Focus ring: `--shadow-focus` on all interactive elements.
- Contrast ≥ 4.5:1 text, ≥ 3:1 large/UI in both themes.
- `prefers-reduced-motion` disables transforms/springs.
- Every composite ships a Storybook story for each state (default/loading/empty/error).

---

## 12. Component Conventions

- File: `kebab-case.tsx`; default export component; named export of variants/types.
- Tailwind utility classes composed from token CSS vars; no inline hex.
- Storybook stories alongside source (`Button.stories.tsx`).
- Visual regression (Chromatic) + `axe` accessibility scan in CI.
