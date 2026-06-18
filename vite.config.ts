import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let cachedResolutions: any[] | null = null
function getResolutions() {
  if (!cachedResolutions) {
    const dataPath = resolve(process.cwd(), 'public/data/resolutions.json')
    cachedResolutions = JSON.parse(readFileSync(dataPath, 'utf-8'))
  }
  return cachedResolutions!
}

function isResolutionDetailRoute(route: string): boolean {
  const parts = route.replace(/\/+$/, '').split('/')
  return parts.length === 5 && parts[1] === 'resolutions' && parts[2] !== 'meetings'
}

function isMeetingRoute(route: string): boolean {
  const parts = route.replace(/\/+$/, '').split('/')
  return parts.length === 3 && parts[1] === 'meetings' && /^\d+$/.test(parts[2])
}

function getPageData(route: string) {
  const data = getResolutions()
  const clean = route.replace(/\/+$/, '')
  const parts = clean.split('/')
  if (parts.length === 3 && parts[1] === 'meetings' && /^\d+$/.test(parts[2])) {
    const ordinal = parseInt(parts[2], 10)
    return data.filter((r: any) => {
      const m = r.source_file && r.source_file.match(/^plenary-(\d+)$/)
      return m && parseInt(m[1], 10) === ordinal
    })
  }
  if (parts.length === 5 && parts[1] === 'resolutions' && parts[2] !== 'meetings') {
    const sourceType = parts[2]
    const sourceFile = parts[3]
    const id = parts[4]
    const res = data.find((r: any) =>
      r.source_type === sourceType && r.source_file === sourceFile && r.id === id
    )
    return res ? [res] : []
  }
  return null
}

function readJson<T>(relPath: string): T {
  const full = resolve(process.cwd(), relPath)
  return JSON.parse(readFileSync(full, 'utf-8')) as T
}

export default defineConfig({
  plugins: [vue()],
  base: process.env.BASE_PATH || '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/') || id.includes('node_modules/vue-router/')) {
            return 'vue-vendor'
          }
          if (id.includes('node_modules/flexsearch/')) {
            return 'flexsearch'
          }
          if (id.includes('node_modules/@asciidoctor/')) {
            return 'asciidoctor'
          }
          if (id.includes('node_modules/@unhead/')) {
            return 'unhead'
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
    mock: true,
    includedRoutes: async () => {
      const resolutions = readJson<any[]>('public/data/resolutions.json')
      const members = readJson<{ all: Record<string, any> }>('public/data/members.json')
      const groups = readJson<any[]>('public/data/groups.json')
      const standards = readJson<any[]>('public/data/standards.json')
      const liaisons = readJson<any[]>('public/data/liaisons.json')
      const nationalBodies = readJson<any[]>('public/data/national-bodies.json')
      const projects = readJson<any[]>('public/data/projects.json')
      const meetings = readJson<any[]>('public/data/meetings.json')
      const posts = readJson<any[]>('public/data/posts.json')
      const pages = readJson<any[]>('public/data/pages.json')

      const resolutionPaths = resolutions.map((r: any) => r.path)
      const meetingPaths = meetings
        .map((m: any) => `/meetings/${m.ordinal}/`)

      const memberPaths = Object.keys(members.all).map((id) => `/members/${id}/`)
      const groupPaths = groups.map((g: any) => `/groups/${g.id}/`)
      const standardPaths = standards.map((s: any) => `/standards/${s.id}/`)
      const liaisonPaths = liaisons.map((l: any) => `/liaisons/${l.id}/`)
      const nationalBodyPaths = nationalBodies.map((nb: any) => `/national-bodies/${nb.id}/`)
      const projectPaths = projects.map((p: any) => `/projects/${p.id}/`)
      const postPaths = posts.map((p: any) => `/posts/${p.slug}/`)
      const pagePaths = pages
        .map((p: any) => p.frontmatter?.permalink || p.url)
        .filter((u: string) => u && !['/about/', '/faq/'].includes(u))

      return [
        '/',
        '/resolutions/',
        '/resolutions/meetings/',
        ...meetingPaths,
        ...resolutionPaths,
        '/members/',
        ...memberPaths,
        '/groups/',
        ...groupPaths,
        '/standards/',
        ...standardPaths,
        '/liaisons/',
        ...liaisonPaths,
        '/national-bodies/',
        ...nationalBodyPaths,
        '/projects/',
        ...projectPaths,
        '/meetings/',
        '/posts/',
        ...postPaths,
        '/about/',
        '/history/',
        '/business-plan/',
        '/faq/',
        '/procedures/',
        '/contact/',
        '/acknowledgments/',
        ...pagePaths,
      ]
    },
    onPageRendered: async (route, renderedHTML) => {
      let html = renderedHTML

      const pageData = getPageData(route)
      if (pageData) {
        const json = JSON.stringify(pageData).replace(/</g, '\\u003c').replace(/<!--/g, '\\u003c!--')
        html = html.replace('</head>', `<script>window.__PAGE_DATA__=${json}</script>\n</head>`)
      }

      // Mark the SPA fallback 404 page as noindex
      if (route === '/404') {
        html = html
          .replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex,nofollow">')
          .replace(/<link\s+rel="canonical"[^>]*>/i, '')
        return html
      }

      // For routes with no real data backing, suppress indexing
      if (!isResolutionDetailRoute(route) && !isMeetingRoute(route)) {
        return html
      }
      const [pageDatum] = pageData || []
      if (!pageDatum) {
        html = html.replace(
          /<meta\s+name="robots"[^>]*>/i,
          '<meta name="robots" content="noindex,follow">',
        )
      }

      return html
    },
  },
})
