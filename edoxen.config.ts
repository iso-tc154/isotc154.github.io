import { defineConfig } from '@edoxen/browser/config'

// Scoped integration: @edoxen/browser owns /meetings/ and /resolutions/ only.
// All other routes are served by the Astro-native site.
export default defineConfig({
  site: {
    title: 'ISO/TC 154 — Meetings & Resolutions',
    description: 'Plenary meetings and resolutions of ISO/TC 154.',
    url: 'https://www.isotc154.org/',
  },
  data: {
    decisions: '_data/resolutions/plenary',
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
