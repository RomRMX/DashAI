# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server with HMR
npm run build     # tsc -b then Vite production build
npm run lint      # ESLint across project
npm run preview   # preview production build locally
```

No test framework — type-check with `npm run build` (tsc strict mode catches errors). The `tsconfig.app.json` also enables `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`, so the build fails on unused bindings and non-erasable TS syntax (enums, `namespace`, parameter properties).

## Architecture

Client-only React 19 / Vite / TypeScript app. No backend. The only external call is RSS feed polling via `api.rss2json.com` in `src/lib/feedFetcher.ts`. All state persists to `localStorage` with keys prefixed `aitoolbox:`.

**Four active columns** rendered by `AppShell.tsx` via the `COLUMNS` array. Projects is wider (`flex: 1.5`); the other three are `flex: 1`.

| Column label | Page | Hook | Types | localStorage key(s) |
|---|---|---|---|---|
| Releases | `ReleasesPage.tsx` | `useReleases` | `types/releases.ts` | `aitoolbox:releases` |
| YouTube | `YouTubePage.tsx` | `useYouTube` | `types/youtube.ts` | `aitoolbox:channels` + `aitoolbox:videos` |
| Tools | `SkillsPage.tsx` | `useSkills` | `types/skills.ts` | `aitoolbox:skills` + `aitoolbox:connectors` |
| Projects | `ProjectsPage.tsx` | — (inline state) | — | `aitoolbox:projects` |

Additional pages exist as files (`DictionaryPage.tsx`, `GuidesPage.tsx`, `TipsPage.tsx`) but are **not mounted** in the current `COLUMNS` array. `TipsPage` and `ProjectsPage` manage their own `localStorage` directly (no shared hook) using `aitoolbox:tips` and `aitoolbox:projects`.

`aitoolbox:lastVisit` is written by AppShell on mount to compute the "N new" amber badge in the header.

**Data layer:** `src/hooks/useLocalStorage.ts` is the base hook most feature hooks build on — it lazily initializes from `localStorage` and returns `{ items, save }`, where `save()` writes both React state and storage. `useSkills` and `useYouTube` manage **two separate keys** each (dual storage pattern).

**Feed polling:** `src/hooks/useFeedPolling.ts` drives periodic background fetches (default 30 min) for Releases and YouTube. It guards against React StrictMode double-mount via a module-level `activePolls` Set, persists `lastPolled` timestamps per feed key, and returns `{ status, lastUpdated, newCount, error, refresh }`. The page-level hooks expose a `mergeFromFeed()` that dedupes incoming items by normalized URL before prepending.

`src/lib/seed-data.ts` supplies default releases and dictionary terms on first load. Skills, YouTube, and Projects seed from inline constants in each page.

`src/lib/utils.ts` provides `uid()`, `now()`, `pad()`, `formatDate()`, `zeroPad()`, and `relativeTime()`.

**Routing:** React Router 7 with a single wildcard route (`<Route path="*" element={<AppShell />} />`). There are no nested routes or `<Outlet>`. AppShell renders the `COLUMNS` array directly as a flex row of panels.

**FlowCanvas:** a resizable **bottom horizontal strip** (default height 325px, clamp 120–800px) that spans the full width below the columns. The drag handle sits on the strip's top edge (`cursor: ns-resize`). Can expand to a full-screen overlay (`z-index: 100`). Lives in `src/components/flowchart/FlowCanvas.tsx`.

**CommandPalette:** `⌘K` / `Ctrl+K` or `/` (when not in a text field) opens a search palette. `Esc` closes all overlays (palette, settings, flow expand). Logic is in the AppShell `keydown` handler.

**Data backup:** AppShell's Settings modal exports every `aitoolbox:*` localStorage key to a dated JSON file and imports the same format (reloads the page on import). Anything you add should keep the `aitoolbox:` prefix so it round-trips through backup/restore.

## Styling

**The design system is documented in `DESIGN.md` at the repo root. Read it before adding or changing UI.** It covers color rules, type scale, heading hierarchy, density/a11y floors, the six recurring patterns, and what not to do.

**Pure CSS variables — no Tailwind, no component library.** Design tokens live in `src/colors_and_type.css`. Use existing tokens rather than hardcoded values.

Key palettes: `--ink-*` (dark backgrounds), `--ash-*` (muted text), `--yale-*` (blue accent), `--signal-orange` / `--signal-red` / `--signal-amber` (status).

Font stacks:
- `--font-display`: Chakra Petch
- `--font-body`: Space Grotesk
- `--font-mono`: JetBrains Mono
- `--font-crt`: VT323

Utility classes (`.card`, `.btn`, `.btn-primary`, `.input`, etc.) are defined in `src/index.css`. Dialogs, grids, and expandable lists are all hand-rolled — **do not reach for Radix UI or shadcn** even though they appear in `package.json` (installed but unused).

## Component patterns

**Dialog/modal:** fixed overlay (z-index 50) with `onClick` to close, `stopPropagation()` inside the form container. No library.

**Card grid:** `display: grid` with `repeat(auto-fill, minmax(300px, 1fr))`.

**External links:** `<a href={url} target="_blank" rel="noreferrer">`.

**Drag-and-drop** (guide step reordering): `@dnd-kit/core` + `@dnd-kit/sortable` with `verticalListSortingStrategy`.

**Markdown rendering** (guide step preview): `react-markdown` + `remark-gfm`.

## Unused dependencies

`@tanstack/react-query` and `@radix-ui/*` are installed but not used — don't add new usage without a clear reason.
