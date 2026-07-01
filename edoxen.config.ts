import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'ISO/TC 154 Resolutions',
    description: 'Resolutions of ISO/TC 154 — Processes, data elements and documents in commerce, industry and administration.',
    url: 'https://www.isotc154.org',
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
