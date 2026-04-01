# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ISO/TC 154 official website — a Jekyll static site with AsciiDoc content, Tailwind CSS v4 styling via Vite, deployed to GitHub Pages.

## Prerequisites

- Ruby 3.3+ (with Bundler)
- Node.js 18+ (with npm)

## Installation

```bash
bundle install    # Ruby dependencies (includes jekyll-vite)
npm install        # Node dependencies (vite, tailwindcss, vue)
```

Both steps are required. `jekyll-vite` will fail to build assets if `node_modules/` is missing.

## Commands

```bash
# Local development
bundle exec jekyll serve --livereload

# Frontend dev (Vite HMR + Jekyll)
./exe/dev

# Production build
bundle exec jekyll build
```

`jekyll-vite` auto-builds Vite assets during `jekyll build`. When serving, if no Vite dev server is running, pre-built assets are served.

## Architecture

**Static site generator**: Jekyll 4.3 with AsciiDoc content (`.adoc` via `jekyll-asciidoc`) and Vite asset pipeline (`jekyll-vite`).

**Frontend stack**: Tailwind CSS v4 via `@tailwindcss/postcss`, Vue 3 for interactive components, dark mode via `class` strategy.

**Layout hierarchy**: `base.html` → `default.html` (with sidebar) → collection layouts. `base.html` → `home.html` (standalone landing page).

**Data-driven sidebar**: `_data/navigation_sidebar.yml` controls left sidebar navigation with 5 item types: `link`, `collection`, `collapsible`, `group`, `years`. The layout has no knowledge of specific pages.

**Header navigation**: `_data/navigation_main.yml` with dropdown menus.

**Custom plugin** (`_plugins/members.rb`): Pre-processes collection data at build time:
- `site.data.members.all[id]` — parsed member with role indexes
- `site.data.members.current`, `.past`, `.leadership`, `.chair` — filtered member ID lists
- `site.data.groups[id]` — group with `.members`, `.convenors`, `.managers`
- `site.data.projects[id]` — project document lookup

**Frontend pipeline** (`_frontend/`):
- `entrypoints/application.css` — Tailwind v4 entry with ISO brand colors
- `entrypoints/application.js` — Vue app entry
- `js/theme.js` — Dark mode toggle (localStorage + system preference)
- `js/navigation.js` — Mobile menu and active nav highlighting
- `components/ThemeToggle.vue`, `components/MobileNav.vue`

**Content collections** (all `.adoc` with YAML frontmatter):
- `_members/` — committee member profiles
- `_groups/` — working groups (WG 3-7, JWG 1 & 8, CAG, ISO 7372 MA)
- `_standards/` — ISO standards
- `_projects/` — active projects
- `_posts/` — news articles
- `_pages/` — static/index pages
- `_procedures/`, `_faq/`, `_agenda/` — misc content

## Brand colors

Primary blue: `#0061ad` (Tailwind `primary-500`). Full palette in `tailwind.config.js` and `_frontend/entrypoints/application.css`.

## Content conventions

- All content files use `.adoc` with AsciiDoc syntax inside YAML frontmatter
- Include `:page-liquid:` after frontmatter to enable Liquid processing within AsciiDoc
- Use `// more` as excerpt separator
- Member roles are arrays of `{id, group, from, to}` objects; `to: null` means current role
- Committee leadership and chair referenced by member ID in `_config.yml` under `committee:`
- Use `&nbsp;` in titles/names to prevent awkward line breaks

## Deployment

GitHub Actions (`.github/workflows/build_deploy.yml`): Ruby + Node.js setup → `bundle exec jekyll build` → deploy to GitHub Pages. `jekyll-vite` handles Vite builds automatically during `jekyll build`.
