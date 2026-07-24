import { defineConfig } from '@edoxen/browser/config'

// Scoped integration: @edoxen/browser owns /meetings/ and /decisions/ only.
// All other routes are served by the Astro-native site.
//
// Data staging: scripts/prepare-edoxen-data.mjs symlinks plenary/, 7372ma/,
// and ballots/ into _data/resolutions-edoxen/ at build time. This way the
// 30 non-plenary decisions (8 from 7372ma, 22 from ballots) render with
// their own URN-keyed detail pages instead of getting lost.
export default defineConfig({
  site: {
    title: 'ISO/TC 154 — Meetings & Decisions',
    description: 'Plenary meetings and decisions of ISO/TC 154.',
    url: 'https://www.isotc154.org/',
  },
  data: {
    decisions: '_data/resolutions-edoxen',
    meetings: '_data/events-edoxen',
  },
  theme: {
    primary: '#1e3a8a',
    accent: '#3b82f6',
    surface: '#ffffff',
  },
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: true,
    darkMode: true,
    printStyles: true,
  },
})
