# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The ISO/TC 154 committee website — an **Astro 7 static site** (Vue islands, Tailwind CSS 4 via `@tailwindcss/vite`), deployed to GitHub Pages at https://www.isotc154.org/ from `main` on every merge. `@edoxen/browser` renders the `/decisions/` registry only; every other route is native Astro.

## Commands

```sh
pnpm build      # full pipeline: build-data → prepare-edoxen-data → build-legacy-redirects → astro build (1,113 pages)
pnpm test       # vitest (152 tests; happy-dom for the list-filter DOM specs)
pnpm dev        # dev server (runs the data pipeline first)
pnpm validate   # Ruby validators: YAML schemas + member status vs live ISO Open Data
pnpm preview    # serve dist/
```

CI (`.github/workflows/build_deploy.yml`): validate (Ruby validators + `edoxen-browser check` + `pnpm test`) → build → deploy to Pages on `main`. Node is pinned to **22.18+** — the build scripts import TypeScript from `.mjs` via Node's native type-stripping.

## Architecture

```
src/pages/       Astro routes (list pages + [id] detail pages; meetings/[id] is the largest)
src/layouts/     BaseLayout (chrome, SEO, theme) + AsciiDocLayout
src/components/  PageHero, ScheduleCalendar, SiteSearch (⌘K omnibar), AgendaDrawers,
                 NextPlenaryBanner (UTC-clock state machine), OrgLogo
src/lib/         The deep modules — display language, data seam, tests live beside them:
                 presentation.ts  labels, ordinals, dates, initials, post helpers
                 meeting.ts       practical labels, sessions, agenda flattening, facets
                 prose.ts         renderProse (one shared Asciidoctor instance)
                 data.ts          loadData + the pipeline's true output types (no casts)
                 plenary-status.ts  banner state machine (UTC calendar days)
                 edoxen-doc.ts    the edoxen DecisionCollection shape (shared with scripts)
                 list-filter.ts   mountListFilter — the one controller behind every filterable list
src/styles/      main.css (@theme tokens — single palette source), filter.css (shared
                 filter-bar family), override.css (edoxen-page chrome; carries its own
                 --ov-* palette mirror because /decisions/ never loads main.css)
src/islands/     Vue islands (HeroSearch, CountUp)
src/data/        navigation.ts, committee.ts (single sources, also consumed by edoxen.config.ts)
```

### Data pipeline (build-time)

`scripts/build-data.mjs` reads `_data/**` + `content/**` and writes `public/data/*.json` (members, meetings, standards, groups, projects, liaisons, national-bodies, posts, history, meta, search-index). Pages read these through `src/lib/data.ts` — **the only** data accessor.

- `scripts/prepare-edoxen-data.mjs` stages the resolutions submodule into `_data/resolutions-edoxen/` (gitignored) — CI runs this before `edoxen-browser check`.
- `scripts/build-legacy-redirects.mjs` emits `src/data/legacy-redirects.json` (639 entries) → astro.config `redirects`.
- Scripts may import from `src/lib` and `src/utils` (type-stripping). `src/utils/{urn,roles,labelTable,ordinal,meetingSource}.ts` are live (pipeline-only); everything else that era produced lives in `attic/`.

### Resolutions data = a submodule

`_data/resolutions` → `iso-tc154/resolutions-data` (Edoxen Model 1.0 YAML; its own CLAUDE.md documents the schema and `edoxen` CLI). Change flow:

1. In the submodule: branch → edit → `bundle exec edoxen normalize <file> --inplace` → `bundle exec edoxen validate "{plenary,ballots,7372ma}/*.yaml"` → commit → push branch → PR → rebase-merge.
2. In this repo: commit the new submodule pointer, rebuild (redirects regenerate automatically), PR, merge.

Transcribe-from-PDF originals into `reference-docs/` and never delete them. Watch for lookalike Unicode in transcriptions (U+2010 hyphens broke URNs once).

## Conventions & gotchas

- **Posts**: `content/posts/yyyy-mm-dd-slug.adoc`; slugs keep the date prefix (`/posts/2026-08-30-…/`), redirects for undated URLs are automatic. AsciiDoc image alt text must not contain unquoted commas (they become positional width/height attrs).
- **Astro whitespace**: keep text and inline elements on one line — JSX-like trimming eats the spaces otherwise.
- **Vue islands**: `defineOptions({ inheritAttrs: false })` or Astro's `data-astro-cid-*` boolean prop breaks hydration.
- **Colors**: use the `@theme` tokens (`var(--color-slate-…)` etc.), never hex literals, in style blocks. Per-category color palettes (calendar, history) are display data, not theme.
- **`astro check` OOMs** — verify with `pnpm build`. Audit a built site with the link-crawl pattern (see git history) before shipping.
- `attic/` holds the retired Jekyll and Vue trees (moved with `git mv`, history intact). Nothing in the build may reference it; keep it that way.

## Standards sync (unchanged from before)

`scripts/sync_iso_open_data.rb` + `.github/workflows/sync_iso_data.yml` keep `_data/standards/*.yml` aligned with ISO Open Data; placeholder YAMLs are real catalogue entries and **must not be deleted**. `validate_member_status.rb` compares national-body membership against the live ISO dataset — a failure means ISO's data moved (e.g. SA lapsed in 2026) and the YAML needs `former: true`.
