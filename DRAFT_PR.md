## Summary

Complete redesign of the ISO/TC 154 website with modern architecture, comprehensive data migration, and new content sections. The site moves from a sparse collection of AsciiDoc pages to a data-driven Jekyll site with structured YAML content, client-side search and filtering, and dedicated pages for all TC 154 activities.

## What's new

### Content & Sections
- **Resolutions archive** (537 resolutions): Every plenary and ballot resolution from 1997–2025, organized by year with search and filtering — previously completely unavailable online
- **Standards catalogue** (94 entries): Full listing of all ISO/TC 154 published and withdrawn standards with ISO stage codes, ICS classifications, scope descriptions, and direct links to purchase on iso.org
- **Projects tracker** (14 active): Current work items at NP, WD, DIS, and other development stages, with scope descriptions
- **Liaison organizations** (25): Dedicated page with logos, categories (A/B), and descriptions for all liaison partners (UN/CEFACT, GS1, IEC, ITU, OASIS, BIMCO, etc.)
- **National bodies** (31): P-member and O-member countries with logos and links

### Member & Group Directory
- **181 member profiles** migrated from AsciiDoc collection to structured YAML with role history (convenor, manager, member, observer, etc.), group assignments, affiliations, and photos
- **13 working groups** (10 active, 3 inactive) with scope, membership, standards, collaborative parties, and leadership history
- Member directory with search, group filter, role filter, and past member toggle

### Data Migration
- All content migrated from Jekyll collections (`.adoc` frontmatter) to structured `_data/*.yaml` files, enabling programmatic access, validation, and external data sync
- Custom Jekyll plugins generate detail pages for members, groups, projects, standards, and resolutions from YAML data
- `sync_iso_data.yml` GitHub Action for automated data synchronization from ISO

### Architecture & Frontend
- **Vite + Tailwind CSS v4** asset pipeline replacing SASS
- **Vue 3** for interactive components (mobile nav, theme toggle)
- **Dark mode** with system preference detection
- **FlexSearch** powered client-side search on standards, projects, and members pages
- **SEO**: Server-rendered HTML on listing pages (standards, projects) for search engine indexing alongside JavaScript-powered filtering
- **Google Analytics** preserved via existing `gtag.js` integration
- ISO brand colors (`#0061ad` primary blue, `#d40000` ISO red for purchase links)

## How to review

1. `bundle install && npm install`
2. `bundle exec jekyll serve --livereload`
3. Browse key pages: `/`, `/standards/`, `/projects/`, `/members/`, `/groups/wg2/`, `/resolutions/`, `/liaisons/`, `/national-bodies/`
4. Test dark mode toggle, search/filter on listing pages, and mobile navigation
