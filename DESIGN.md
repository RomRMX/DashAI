# DashAI Design System v1

**Mission:** Dense, keyboard-first AI intelligence dashboard that reads like a control panel.

Tool-for-one. Black ground. Stencil display. Mono accents. Density over decoration. No gradients, no drop shadows except modal lift, no rounded corners (with named exceptions).

---

## 1. Tokens live in CSS

All tokens: `src/colors_and_type.css`. Utility classes: `src/index.css`. Never hardcode hex or font-family — use the vars.

---

## 2. Color

### Surfaces (`--ink-*`)

| Token | Hex | Role |
|---|---|---|
| `--ink-900` | `#000000` | body ground |
| `--ink-800` | `#0a0a0c` | panel ground (dialog boxes) |
| `--ink-700` | `#111317` | raised panel, input fill |
| `--ink-600` | `#1a1d22` | hover state |
| `--ink-500` | `#252930` | active / strong border substrate |

### Text (`--fg*`)

| Token | Hex | Contrast on ink-900 | Use |
|---|---|---|---|
| `--fg` (= `--ivory-100`) | `#f4f9e9` | 18.5:1 | body text, titles |
| `--fg-muted` (= `--ash-300`) | `#b4b8ab` | 9.8:1 | descriptions, labels |
| `--fg-dim` | `#7a7e77` | 4.6:1 | timestamps, counts, "last seen" |

All meet WCAG AA (4.5:1). `--fg-dim` was bumped from `#656962` to clear the floor.

### Accent + links

| Token | Role |
|---|---|
| `--yale-500` `#284b63` | primary action fill (rare — we lean on orange) |
| `--yale-300` `#5a87a5` | link color + hover |

### Signals (`--signal-*`) — one per composition

| Token | Hex | Rule |
|---|---|---|
| `--signal-orange` | `#ff5a1f` | identity + temporal pins: company tags, release dates, active tab, CRT tick, primary button, selection, focus ring |
| `--signal-amber` | `#d9a43d` | attention / freshness: "New" badges, "N new since last visit", pending states |
| `--signal-red` | `#d94a3d` | destructive only: delete confirmations |

**Never mix red with another signal on the same row.** Orange + amber is fine (e.g. company + New).

### Reserved (documented, not used in 4-column UI)

| Token | Reserved for |
|---|---|
| `--space-600/700` | FlowCanvas node fills, graph backgrounds |
| `--parchment-100/200/300`, `--ivory-200` | future long-form reading surface (e.g. a Guides page) |

### Borders

- `--border`: `rgba(244, 249, 233, 0.10)` — default hairline
- `--border-strong`: `rgba(244, 249, 233, 0.22)` — dialog outlines, input edges, hover accents

---

## 3. Type

Two scales. Don't mix them.

### Dashboard scale (the 4-column UI)

| Size | Font | Use |
|---|---|---|
| 9px | `--font-mono` | counts, timestamps, last-seen, meta chips |
| 10px | `--font-display` or mono | button labels (`.btn` fallback 11px), stencil badges, form labels |
| 11px | mixed | input text, nav tab labels, ⌘K hint |
| 12px | `--font-display` | column h2, dictionary term h3 (uppercase, tracked) |
| 13px | `--font-display` | card titles (Release name) |
| 16px | `--font-body` | prose inside dialogs (respects mobile readable floor) |

### Marketing scale (`.h-mega`, `.h1`–`.h4`)

Defined in `colors_and_type.css`. Reserve for a future About / splash page. **Do not use inside columns.**

### Font roles — strict

| Variable | Use |
|---|---|
| `--font-display` (Chakra Petch) | Column titles, card titles, section labels, stencil badges, buttons. Always uppercase, `letter-spacing: 0.06–0.22em`. |
| `--font-body` (Space Grotesk) | Prose, descriptions, dialog copy. |
| `--font-mono` (JetBrains Mono) | Counts, metadata, keyboard hints, timestamps, form labels (as small caps via letter-spacing). |
| `--font-crt` (VT323) | **One signature move:** release date display in orange. That's it. Don't dilute. |

Global `button, input, select, textarea, kbd { font-family: inherit; }` stops UA Arial leak.

### Letter-spacing vocabulary

- Headings / stencils: `0.08–0.22em`
- Buttons: `0.18em` (with optical comp on padding, see `.btn`)
- Body: `0`
- Never negative (we aren't Apple)

---

## 4. Heading hierarchy

Exactly this:

- `<h1>` — `RMX.AI` brand in `AppShell` header. One per page.
- `<h2>` — column title (Releases / YouTube / Skills / Dictionary).
- `<h3>` — item title inside a column (release name, video title, term, skill/connector name).
- `<h4>+` — not used. Dialog headings are styled `div`s (they're not landmarks).

Global reset: `h1–h6 { margin: 0; font-size: inherit; font-weight: inherit; }` so per-instance inline styles win cleanly.

---

## 5. Density + accessibility

### Touch targets

**Floor: 32×32px.** WCAG AA = 24, AAA = 44. We pick 32 as the density compromise. Enforced via `.btn-icon { min-width: 32px; min-height: 32px }` and on tab buttons.

### Contrast

All text ≥11px meets 4.5:1 on `--ink-900` (see Color table). Don't invent new greys — use `--fg`, `--fg-muted`, `--fg-dim`.

### Focus rings

Global `:focus-visible { outline: 2px solid var(--signal-orange); outline-offset: 2px; }`. Keyboard users see it; mouse users don't (`:focus:not(:focus-visible) { outline: none }`).

### Reduced motion

Global media query zeroes animation/transition durations when `prefers-reduced-motion: reduce`. Keep it that way.

---

## 6. Patterns (the six recurring moves)

### 6.1 Column panel

Flex column, full height. Header row (h2 + zero-padded count + Add button). Optional filter/sort bar. Scrollable list with `overflow: auto; flex: 1`.

```
┌ Releases 07        [Add] ┐
├ [Search……..] [Company ▾] ┤
├ [newest][oldest][company]┤
├ ──────────────────────── ┤
│ card                     │ ← flex:1, overflow:auto
│ card                     │
└──────────────────────────┘
```

Reference: `ReleasesPage.tsx`.

### 6.2 Expandable list row

`▾` / `›` glyph + uppercase title. Click row to toggle open. Body (definition / step list) appears below with Edit + `.btn-icon` × delete.

Reference: `DictionaryPage.tsx` `TermEntry`.

### 6.3 Card row

Title line: `<h3>` name + stencil badge(s) on left, `.font-crt` date on right. Description in `--fg-muted`. Action row: Link (if URL), Edit, `×`. `border-bottom: 1px solid var(--border)` between rows (no card shadow — that's marketing).

Reference: `ReleasesPage.tsx` `ReleaseCard`.

### 6.4 Dialog

Fixed overlay `rgba(0,0,0,0.8)`, `z-index: 50`. Form box: `background: var(--ink-800)`, `border: 1px solid var(--border-strong)`, `padding: 24px`, `width: 440px`, `box-shadow: var(--shadow-lift)`. Click outside closes (overlay `onClick`, form `onClick={e.stopPropagation()}`). Heading row ends with `border-bottom: 1px solid var(--border)`. Esc closes (handled globally in `AppShell`).

Reference: `ReleaseDialog`, `TermDialog`, `SettingsModal`.

### 6.5 Empty state

`<EmptyState label="No X found" action="Add" onAction={…} />`. Centered. One component, already in `components/ui/EmptyState.tsx`. Use it every time a list is empty — never ship bare empty columns.

### 6.6 Stencil badge (`.stencil`)

Small-caps, `font-display`, `letter-spacing: 0.22em`, 2px border in signal color, padding with optical comp. Variants: `.orange`, `.amber`, `.red`, `.muted`, `.blue`. Size 8–10px.

Rules:
- Orange = company / identity / owner
- Amber = state ("New", "Pending")
- Red = destructive only (rare)
- Max 2 badges per row. Never 3.

---

## 7. Motion

| Token | Use |
|---|---|
| `--dur-fast: 120ms` | hover color/border transitions |
| `--dur-base: 200ms` | dialog fade-in, expand toggles, `.fade-in` |
| `--dur-slow: 400ms` | reserved, not used currently |

Easing: `--ease-out` for natural, `--ease-snap` for button press. The 1.1s `.blink` is reserved for the LIVE indicator — don't apply it elsewhere.

Always respect `prefers-reduced-motion` (already global).

---

## 8. Layout

- App shell: `display: flex; flex-direction: column; height: 100vh; overflow: hidden`.
- Columns: 4-wide flex row, each `flex: 1; min-width: 0`, `border-right: 1px solid var(--border)` except last.
- Below 1024px: 2×2 grid. Below 640px: single column stack. Handled in `index.css` via `.columns-grid` media queries.
- Flow bar: fixed 325px bottom strip, expands to full-screen overlay on toggle (`z-index: 100`).
- Body: 48px grid lines at 2.5% opacity. That's the texture. Don't stack more.

---

## 9. What NOT to do

- **No Tailwind, no shadcn, no Radix.** They're installed but unused. Keep it that way.
- **No rounded corners on new components.** Sharp by default. Exceptions in `--r-*` exist for future surfaces (Guides cassette card shape, rating chip).
- **No drop shadows** except `--shadow-lift` on modals and `--shadow-crisp` where hairline is needed.
- **No emojis as UI icons.** Text glyphs (▾, ›, ×, ⌘, ↓, ↑, ⚙) are OK — they're typographic, not emoji.
- **No new accent colors.** If you need a signal, it's one of orange/amber/red. If you're reaching for blue, use `--yale-300` for links and stop.
- **No font outside the four tracks** (`display`, `body`, `mono`, `crt`). Don't introduce a fifth.
- **No h4+ in the dashboard.** The hierarchy is h1→h2→h3, done.
- **No `.stencil` without a signal variant class** — the plain grey outline is reserved for future use.

---

## 10. File map

| File | What lives there |
|---|---|
| `src/colors_and_type.css` | Palette, fonts, type scale, spacing, radii, shadows, motion tokens |
| `src/index.css` | Resets, utility classes (`.card`, `.btn*`, `.input`, `.stencil`), focus rings, responsive breakpoints |
| `src/components/ui/EmptyState.tsx` | Empty-state primitive |
| `src/pages/*Page.tsx` | Column implementations — each follows the Column panel pattern |
| `src/components/layout/AppShell.tsx` | Shell + header + Flow bar + command palette + settings modal |

---

## 11. When to edit this doc

Update `DESIGN.md` when:
- a new pattern repeats in two or more places (codify it as §6.N)
- a token is added, renamed, or repurposed
- the heading hierarchy shifts (new top-level surface)
- a rule in §9 gets broken intentionally (explain why)

Don't update it for one-off style tweaks inside a single component.
