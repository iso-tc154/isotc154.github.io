import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'

// Phase 1: Astro foundation without @edoxen/browser (data fixtures not yet
// cherry-picked from rt-bad-code — that lands in Phase 5).
// browser({ config: cfg }) is re-enabled once _data/events-edoxen/ and the
// URN'd resolutions submodule pointer are cherry-picked.
export default defineConfig({
  site: 'https://www.isotc154.org',
  integrations: [
    vue(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
