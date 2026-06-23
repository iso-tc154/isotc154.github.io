# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current stack (vite-ssg)

The site is built with **vite-ssg + Vue 3 + TypeScript + Tailwind CSS v4**. Live code lives in `src/`, content in `content/`, raw data in `_data/`. Build entry points:

```sh
npm run dev       # Vite dev server (no SSG)
npm run build     # vite-ssg build → dist/, writes sitemap.xml & robots.txt
```

Active directories:

```
src/              # Vue 3 application — views/, components/, composables/, domain/, types/, utils/
src/domain/       # Deep pure-function modules (no Vue): meetingSource, resolutions, routeMetaHydrate
src/types/        # Type model — plenary.ts is canonical for Plenary/PlenarySource; event.ts & meeting.ts are legacy re-export shims
content/          # AsciiDoc / Markdown source for posts and pages
_data/            # YAML data (national_bodies.yml, liaisons.yml, events/, members/, projects/, resolutions/, standards/)
scripts/          # Build helpers (sync_iso_open_data.rb, build-data.mjs, post-build.mjs, validate_yaml.rb)
.omo/             # Output of omo (local AI tooling) — not part of the site build
.playwright-mcp/  # Playwright MCP screenshots — not part of the site build
```

### SEO pipeline

Routes → `src/utils/routeMeta.ts` (dispatcher) → `src/data/routeMetaTable.ts` (static routes) or `src/domain/routeMetaHydrate.ts` (detail routes) → `src/utils/seo.ts:buildHeadObject` → `<head>` tags via `@unhead/vue`. The `src/composables/useSeo.ts` watcher lazy-loads only the entity kind a route needs via `entitiesNeededForRoute()`. Site-wide stats (counts, latest items) come from `data/meta.json` via `src/composables/useSiteStats.ts` — distinct from the SEO `<meta>` tags.

### Sync ISO Open Data — Ruby → GHA handoff

Weekly GitHub Actions workflow (`.github/workflows/sync_iso_data.yml`, Mon 02:00 UTC) runs `scripts/sync_iso_open_data.rb`. The script:

1. Downloads the TC 154 slice of ISO's JSONL Open Data dataset once.
2. **Sync phase** — for each `_data/standards/*.yml`, fills missing `iso.store_id`, `iso.stage`, `iso.ics`, `iso.publication_date` from the matching ISO deliverable. Never overwrites existing values.
3. **Discover phase** — for each TC 154 deliverable with no matching local YAML, appends to `scripts/.new-standards.json` (transient manifest; safe to delete, regenerated each run) and emits a placeholder YAML in `_data/standards/`.
4. The workflow then creates one GitHub issue per new deliverable (idempotent: existing issues are filtered by ISO reference in title) and opens/updates a rolling PR on `chore/sync-iso-data`.

Placeholder YAMLs are real catalogue entries and MUST NOT be deleted — they represent TC 154 deliverables ISO has registered; deleting them silently drops standards from the site. See "Standards Data Pipeline" below for the editor workflow when a `new-standard` issue lands.

## Historical: Jekyll stack (dormant)

> The sections below describe the **previous** Jekyll-era stack. The migration to vite-ssg left `_plugins/`, `_layouts/`, `_includes/`, `_pages/`, `_frontend/` in place per the global no-delete rule. They are no longer part of the build — the live code is in `src/`. Treat the Jekyll notes as historical context for those dormant directories and for `_data/` YAML shapes that still flow into the new build via `scripts/build-data.mjs`.

### Build Commands (historical)

```sh
# Build the Jekyll site (runs Vite automatically via jekyll-vite plugin)
bundle exec jekyll build

# Development server (Jekyll + Vite hot reload)
bundle exec jekyll serve --watch

# Frontend-only (Vite dev server, no Jekyll)
npm run dev

# Production frontend build
npm run build
```

The `jekyll-vite` plugin runs Vite automatically during `jekyll build` — no separate build step needed for assets.

### Architecture (historical)

### Stack
- **Jekyll 4** — static site generator, content in AsciiDoc (`.adoc`) and Markdown (`.md`)
- **Vite 7** — frontend build tool, integrated via `jekyll-vite` Ruby gem
- **Vue 3** — lightweight SPA components (MobileNav, ThemeToggle) mounted via `#vue-app`
- **Tailwind CSS v4** — utility-first CSS (uses `@import "tailwindcss"` not v3 `@tailwind` directives)
- **Liquid 4** — templating with constraints (see Liquid Gotchas below)

### Directory Structure
```
_plugins/          # Jekyll generators (members.rb, resolutions.rb, organization_pages.rb, etc.)
_data/             # YAML data files (national_bodies.yml, events/, members/, resolutions/)
  events/          # Plenary meeting data (plenary-meeting-{n}.yml)
  members/         # Member role records (one file per member)
_layouts/          # HTML layouts (base.html, default.html with sidebar, specialized layouts)
_includes/         # Liquid template includes
_pages/            # Jekyll pages and AsciiDoc content
_frontend/         # Frontend source (Vue components, CSS, JS entrypoints)
  entrypoints/     # application.js/css (Vite entry points)
  css/             # Component CSS files (imported by application.js)
  components/      # Vue 3 components
  js/              # Vanilla JS (theme, navigation, filters)
assets/            # Static assets (images, fonts)
```

### Jekyll Plugins

| Plugin | Purpose |
|--------|---------|
| `members.rb` | Pre-processes `site.data.members` with role indexes. Adds `roles['_all']['in']['_all']`, convenience booleans (`is_current`, `is_in_leadership`), group convenor/manager/member lists |
| `resolutions.rb` | Reads YAML from `_data/resolutions/` submodule, populates `site.data.resolutions_all`, `site.data.resolutions_by_year`, `site.data.resolutions_years`. Generates year-index and detail pages |
| `organization_pages.rb` | Generates detail pages for liaisons and national bodies from `liaisons.yml` / `national_bodies.yml` data |
| `jekyll-vite` | Runs Vite build automatically during Jekyll build |

### Data Model

**Members** — stored in `_data/members/{id}.yml`. Pre-processed by `members.rb` into `site.data.members`:
```yaml
# site.data.members.all[id].roles structure
roles:
  '_all': { 'in': { '_all': [role_record, ...], 'wg5': [...] } }
  'convenor': { 'in': { '_all': [...], 'wg5': [...] } }
  'manager': { 'in': { '_all': [...] } }
```

**National bodies / Liaisons** — stored in `_data/national_bodies.yml` / `_data/liaisons.yml`. Detail pages generated by `organization_pages.rb`.

**Events** — stored in `_data/events/plenary-meeting-{n}.yml`. Accessed via `site.data.events["plenary-meeting-42"]` (key = filename without `.yml`).

**Standards** — stored in `_data/standards/{slug}.yml`. Source of truth for the standards catalogue. Each file has an `iso:` block (name, type, title, stage, publication_date, ics, store_id, scope) and a `tc154:` block (status, group, introduction, scope, editorial fields). See "Standards Data Pipeline" below for how these files stay in sync with ISO Open Data.

### Standards Data Pipeline

`_data/standards/*.yml` is kept in sync with [ISO Open Data](https://www.iso.org/open-data.html) via a single Ruby script and a single GitHub Actions workflow. The script does both jobs in one pass after a single download of the JSONL dataset:

| Component | Purpose |
|-----------|---------|
| `scripts/sync_iso_open_data.rb` | **Phase 1 (sync)**: for each local YAML, fill in missing `iso.store_id`, `iso.stage`, `iso.ics`, `iso.publication_date` from the matching TC 154 deliverable. Never overwrites existing values. **Phase 2 (discover)**: for each TC 154 deliverable with no matching local YAML, append to `scripts/.new-standards.json` manifest and generate a placeholder YAML file if one doesn't yet exist. |
| `.github/workflows/sync_iso_data.yml` | Weekly Mon 02:00 UTC. Runs the script, ensures the `new-standard` label exists, creates one GitHub issue per discovered deliverable (idempotent), opens/updates a rolling PR on `chore/sync-iso-data` containing both metadata updates and placeholders. |

**Idempotency** — safe to run repeatedly:
- **Issues**: `gh issue list --label new-standard --state all` is fetched once per run and filtered by ISO reference in the title (via `jq`). Any existing issue (open or closed) for the same reference prevents duplicate creation.
- **PR**: `peter-evans/create-pull-request@v7` on branch `chore/sync-iso-data` creates the PR on first run and pushes additional commits on subsequent runs. Never opens a second PR for the same branch. `delete-branch: true` recreates the branch cleanly after merge or close.
- **Placeholders**: the script skips YAML generation if a file with the derived slug already exists. Matching against existing YAMLs uses `iso.name` plus two normalizations: Amd/Cor dash (`ISO …/Amd-1:…` ↔ `ISO …/Amd 1:…`) and D-stage iteration suffix (`ISO/DTR 20180.2` ↔ `ISO/DTR 20180`, where `.N` is the Nth circulation of a DIS/DTR/DTS/FDIS/FDTR/FDTS/PRF draft). Non-D-stage suffixes (e.g. `ISO/PWI 16356.2`) are left intact — they are not iteration counters.
- **Metadata**: `iso_field_missing?` only writes a field when it's nil or empty — existing editorial values are never overwritten.

**Placeholder YAML shape** (minimal — no editorial content):
```yaml
---
iso:
  name: ISO/AWI TR 24980        # reference from ISO Open Data
  type: TR                       # derived: TS, TR, or international
  title: Application of data…    # English title extracted from { en:, fr: }
  stage: '10.99'                 # formatted from integer code
  publication_date: '2026-04-29' # only if present
  ics: 35.240.63                 # only if present
  store_id: 90785                # ISO Store numeric ID
tc154:
  status: under_development      # derived from stage (<60.00 under_development, <95.99 published, else withdrawn)
  # group, introduction, scope pending — see linked new-standard issue
---
```

**Editor workflow when a `new-standard` issue lands**:
1. Confirm responsible working group → set `tc154.group`.
2. Draft introduction → set `tc154.introduction`.
3. Confirm scope → set `iso.scope` (or `tc154.scope` if it differs).
4. Add to publication history if applicable.
5. Close the issue. The placeholder stays on `main`; future sync runs will keep its metadata current.

**Local validation** — the script is safe to run directly; it will create real placeholder files in `_data/standards/` and a manifest at `scripts/.new-standards.json`. **Placeholder YAMLs are real catalogue entries and MUST NOT be deleted.** They represent TC 154 deliverables that ISO has registered; deleting them silently drops standards from the site and re-creating them on the next run loses any local edits.
```sh
ruby scripts/sync_iso_open_data.rb
# To review what changed:
git status _data/standards/
git diff _data/standards/      # metadata updates on existing YAMLs
git status --short _data/standards/ | grep '^??'   # new placeholder YAMLs
# Then commit the placeholders + metadata updates — do NOT delete them.
```

The manifest at `scripts/.new-standards.json` is a transient artifact (consumed by the GHA workflow to open issues) and is safe to leave untracked or remove; it is regenerated on every run.

### Frontend Pipeline

1. `vite.config.ts` — Vite config with RubyPlugin (reads `config/vite.json` for Jekyll asset paths)
2. `application.js` — imports all CSS files in correct order, then JS modules
3. `application.css` — `@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@theme` for custom tokens
4. **CSS import order**: All component CSS imports must come **before** `@import "tailwindcss"` in `application.css`. Component CSS is imported from `application.js`, so the import order is: `typography.css` (first) → all component CSS → `tailwindcss` (last)

### Navigation

- **Main nav** (`_data/navigation_main.yml`) — header dropdown items
- **Sidebar** (`_data/navigation_sidebar.yml`) — declarative section matching using `match` (exact contains) or `url_prefixes` (array of URL prefixes, first-match-wins). Sections with `type: group` close the current `</ul>` and open a new one, creating orphaned empty `<ul>` — avoid `type: group`, flatten to `type: link` items

### Logo / Image Paths
- National body logos: `/assets/images/national-bodies/logo-{id}.{ext}`
- Dark/light variants: use `logo_light` / `logo_dark` YAML fields with `class="dark:hidden"` / `class="hidden dark:block"`

---

## Working with Member Profiles

### Adding a Member

1. Create `_data/members/{id}.yaml` with fields:
   - `member-id` (required, matches filename)
   - `name` (required)
   - `active` (required, `true` or `false`)
   - `picture` (optional, filename in `/assets/images/members/`)
   - `affiliation` (optional, organization name)
   - `bio` (optional, multi-line YAML string)
   - `roles` (optional, list of role records with `id`, `group`, `from`/`to` dates)
   - `deceased` (optional, `true` for deceased members)
   - `links` (optional, list of `{label, url}` social/external links)

2. Role record format:
   ```yaml
   roles:
   - id: member          # chair, convenor, manager, member, observer, partner, etc.
     group: cag           # optional: wg5, jwg1, cag, etc.
     from:
       date: 2024-01-01
       precision: year    # day, month, or year
     to:                  # omit for current roles
       date: 2025-06-01
       precision: month
   ```

3. The `members.rb` plugin processes all YAML files at build time. No plugin changes needed for new fields — they propagate automatically via `clone`.

4. Member detail pages are generated by `members.rb` at `/members/{member-id}/`.

### Marking a Member as Deceased

1. Set `active: false` and add `deceased: true` to their YAML file
2. Ensure all roles have `to` dates (plugin marks `is_current` true if any role has `to == nil`)
3. Templates automatically apply: "In Memoriam" label (gray), grayscale photo
4. For an obituary blog post, create `_posts/{date}-{name}-obituary.adoc` using `layout: post` and `:page-liquid:` to link to the member page

### Modifying a Member

Edit `_data/members/{id}.yaml` directly. The `members.rb` plugin clones all fields, so custom YAML fields are accessible as `member.field_name` in Liquid templates without plugin changes.

### Removing a Member

Delete `_data/members/{id}.yaml`. The member will no longer appear in any lists or generated pages after rebuild.

### Member Photos

- Store in `/assets/images/members/{member-id}.jpg` (or .png)
- Set `picture` field in YAML to the filename (e.g., `picture: john-doe.jpg`)
- Members without photos show initials automatically

---

## Liquid Gotchas (Liquid 4.0.4)

### Include parameter bracket notation
Jekyll's Liquid parser rejects bracket notation in `include` params:
```liquid
{% include plenary_detail.html event=site.data.events[page.event_id] %}  <!-- FAILS -->
```
Use `assign` first:
```liquid
{%- assign event = site.data.events[page.event_id] -%}
{% include plenary_detail.html event=event %}
```

### `{% elsif %}` inside `{% for %}`
`{% elsif %}` cannot appear inside `{% for %}` loops — use `{% case %}`/`{% when %}` instead.

### `{% comment %}` blocks still parse tags
Include tag syntax inside `{% comment %}` blocks is still validated and will error. Remove example syntax from comment blocks.

### `| default` filter
The `default` filter only checks for nil/empty, not key existence in hashes.

### `doc.layout` vs `doc.data['layout']`
For Jekyll `Page` objects, `doc.layout` works where `doc.data['layout']` may fail depending on the Liquid drop implementation. Prefer `doc.layout` when available.

### `for x in string` iterates characters
`{% for x in string %}` iterates over each **character**, not comma-separated values. Use `split` first.
