# ISO/TC 154 Resolutions Browser (new)

This is the new `@edoxen/browser` (Astro) site, replacing the old
Vue/Vite browser in `src-legacy/`.

## Status

- **Data:** All 80 YAML files in `resolutions-data/` are migrated to
  edoxen 1.0 format. The `scripts/migrate-to-v3.rb` script
  transformed 39 files from pre-1.0 `localizations[]` to per-field
  `LocalizedString[]`. `metadata.title` scalar → array, nested
  `actions/approvals/considerations` message fields lifted.
- **Browser:** New Astro setup with `@edoxen/browser` v0.1.6.
  Config in `edoxen.config.ts`. Theme tokens extracted from the
  legacy browser's CSS.
- **Legacy:** The old Vue/Vite source is preserved in `src-legacy/`
  for reference.

## What remains (for a colleague)

1. `pnpm install` in this directory.
2. `pnpm build` — verify the Astro build succeeds.
3. The data path in `edoxen.config.ts` points at
   `../resolutions-data/plenary` — verify this resolves correctly.
   May also need to add `ballots/` and `7372ma/` as additional data
   sources (or merge them into one directory).
4. Refine the theme in `edoxen.config.ts` → `theme` and
   `src/styles/override.css` to match the exact ISO/TC 154 brand
   colors from `src-legacy/assets/main.css`.
5. Migrate custom content from the legacy site:
   - About page, committee info, member list.
   - ISO/IEC logo branding.
   - Reference-docs links.
6. Remove `src-legacy/` once the new browser is verified.
7. Update CI/CD to build from this directory.
