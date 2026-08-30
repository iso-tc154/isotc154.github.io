import { defineConfig } from '@edoxen/browser/config'

// Scoped integration: @edoxen/browser owns /meetings/ and /decisions/ only.
// All other routes are served by the Astro-native site.
//
// Data staging: scripts/prepare-edoxen-data.mjs symlinks plenary/, 7372ma/,
// and ballots/ into _data/resolutions-edoxen/ at build time. This way the
// 30 non-plenary decisions (8 from 7372ma, 22 from ballots) render with
// their own URN-keyed detail pages instead of getting lost.
//
// Theme: tokens mirror src/styles/main.css so the edoxen-hosted pages sit
// inside the same design system as the site (light/dark palettes, DM Sans +
// Source Serif 4, ISO red logos, site nav labels). Structural chrome that
// tokens cannot reach (fixed header, brand bar, dotted canvas) lives in
// src/styles/override.css, which the package auto-detects and imports
// after its own base.css.
export default defineConfig({
  site: {
    title: 'ISO/TC 154',
    subtitle: 'Standards for commerce, industry and administration',
    description: 'Plenary meetings and resolutions of ISO/TC 154.',
    url: 'https://www.isotc154.org/',
  },
  data: {
    decisions: '_data/resolutions-edoxen',
    meetings: '_data/events-edoxen',
  },
  theme: {
    // Light palette — mirrors :root tokens in src/styles/main.css
    primary: '#1c1917',
    accent: '#1e3a8a',
    surface: '#ffffff',
    background: '#fafaf9',
    text: '#1c1917',
    muted: '#78716c',
    border: '#e7e5e4',
    success: '#047857',
    warning: '#b45309',
    danger: '#b91c1c',
    // Dark palette — mirrors .dark / --surface-*-dark tokens in main.css
    dark: {
      primary: '#fafaf9',
      accent: '#94b6e8',
      surface: '#232320',
      background: '#1a1a1a',
      text: '#e8e6e1',
      muted: '#b8b3a9',
      border: '#2e2e2a',
    },
    logos: {
      primary: '/assets/iso-red.svg',
      footer: '/assets/iso-red.svg',
      favicon: '/assets/favicon.svg',
    },
    fontFamily: "'DM Sans', sans-serif",
    radius: '0.5rem',
    customProperties: {
      // Headings/brand resolve through --edoxen-font-display.
      'font-display': "'Source Serif 4', serif",
      'font-mono': "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
  },
  // Mirror the site's top-level navigation (src/data/navigation.ts).
  // Edoxen nav is flat — dropdowns collapse to their parent entry.
  nav: [
    { label: 'About', href: '/about/' },
    { label: 'Our Work', href: '/standards/' },
    { label: 'Meetings', href: '/meetings' },
    { label: 'Members', href: '/members/' },
    { label: 'News', href: '/posts/' },
    { label: 'Resources', href: '/procedures/' },
  ],
  social: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/iso-tc154/',
      icon: 'linkedin',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/ISO-TC154',
      icon: 'github',
    },
  ],
  footer: {
    message: 'Meetings and resolutions of ISO/TC 154.',
    copyright: '© ISO/TC 154',
    showEdoxenAttribution: true,
  },
  terminology: {
    decision: 'resolution',
    decisions: 'resolutions',
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
