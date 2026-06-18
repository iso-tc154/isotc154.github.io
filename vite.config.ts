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

const COMMITTEE_NAME = 'ISO/TC 154'
const COMMITTEE_FULL = 'ISO/TC 154 — Processes, data elements and documents in commerce, industry and administration'
const SITE_URL = 'https://www.isotc154.org'
const TWITTER_HANDLE = '@isostandards'
const DEFAULT_OG_IMAGE = '/assets/og/iso-tc-154-card.png'

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) : s
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

function toIsoDate(s?: string | null): string | undefined {
  if (!s) return undefined
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (iso) {
    const [, y, mo, d, hh, mm] = iso
    return hh && mm ? `${y}-${mo}-${d}T${hh}:${mm}` : `${y}-${mo}-${d}`
  }
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (!m) return undefined
  const [, d, mon, y, hh, mm] = m
  const month = MONTHS[mon]
  if (!month) return undefined
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  if (hh && mm) return `${y}-${pad(month)}-${pad(+d)}T${pad(+hh)}:${pad(+mm)}`
  return `${y}-${pad(month)}-${pad(+d)}`
}

function readJson<T>(relPath: string): T {
  const full = resolve(process.cwd(), relPath)
  return JSON.parse(readFileSync(full, 'utf-8')) as T
}

function buildHead(opts: {
  title: string
  description: string
  canonicalPath: string
  type?: 'website' | 'article'
  image?: string
  publishedTime?: string
  modifiedTime?: string
  jsonLd?: object
}): string {
  const title = escapeAttr(opts.title)
  const desc = escapeAttr(truncate(opts.description, 160))
  const canonical = `${SITE_URL}${opts.canonicalPath}`
  const image = opts.image
    ? (opts.image.startsWith('http') ? opts.image : `${SITE_URL}${opts.image}`)
    : `${SITE_URL}${DEFAULT_OG_IMAGE}`
  const type = opts.type || 'website'

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:site_name" content="${COMMITTEE_NAME}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="${TWITTER_HANDLE}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${image}">`,
  ]
  if (opts.publishedTime) tags.push(`<meta property="article:published_time" content="${opts.publishedTime}">`)
  if (opts.modifiedTime) tags.push(`<meta property="article:modified_time" content="${opts.modifiedTime}">`)
  if (opts.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c')}</script>`)
  }
  return tags.join('\n  ')
}

function injectMeta(html: string, headTags: string, opts?: { stripExistingDescription?: boolean }): string {
  let out = html
  if (opts?.stripExistingDescription) {
    out = out.replace(/<title>.*?<\/title>/, '')
  }
  // Replace whatever title we have with our bundle (which includes a fresh <title>)
  out = out.replace(/<title>.*?<\/title>/s, '')
  // Strip pre-existing basic SEO tags so we don't duplicate
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, '')
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, '')
  out = out.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"[^>]*>/gi, '')
  out = out.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"[^>]*>/gi, '')
  out = out.replace('</head>', `  ${headTags}\n</head>`)
  return out
}

function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: COMMITTEE_NAME,
    alternateName: COMMITTEE_FULL,
    url: SITE_URL,
    logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    sameAs: [
      'https://www.iso.org/committee/54094.html',
      'https://www.linkedin.com/company/iso-tc-154',
      'https://github.com/isotc154',
    ],
  }
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: COMMITTEE_NAME,
    description: COMMITTEE_FULL,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
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

      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s)
      let title = titleMatch ? stripHtml(titleMatch[1]).trim() : null
      title = title ? title.replace(/[🇦-🇿🌐]\s*/gu, '').trim() : null

      // Pull a description from the first <p> after the h1, if available
      const bodyDescMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/)
      const bodyDesc = bodyDescMatch ? stripHtml(bodyDescMatch[1]).trim() : ''

      let head: string | null = null

      const cleanRoute = route.replace(/\/+$/, '') || '/'
      const parts = cleanRoute.split('/').filter(Boolean)

      // HOME
      if (cleanRoute === '/') {
        head = buildHead({
          title: `${COMMITTEE_NAME} — Processes, data elements and documents in commerce, industry and administration`,
          description: `${COMMITTEE_FULL}. Browse ISO/TC 154 standards, plenary meetings, resolutions, and members.`,
          canonicalPath: '/',
          type: 'website',
          jsonLd: { '@context': 'https://schema.org', '@graph': [organizationJsonLd(), websiteJsonLd()] },
        })
      }
      // RESOLUTION DETAIL: /resolutions/:sourceType/:sourceFile/:id/
      else if (isResolutionDetailRoute(route)) {
        const id = parts[4]
        const descMatch = html.match(/<p[^>]*class="[^"]*res-detail-subtitle[^"]*"[^>]*>(.*?)<\/p>/s)
        const desc = descMatch ? stripHtml(descMatch[1]).trim() : (bodyDesc || `${title || id} — resolution adopted by ${COMMITTEE_NAME}.`)
        const [resolution] = pageData || []
        head = buildHead({
          title: `${title || id} | Resolutions | ${COMMITTEE_NAME}`,
          description: desc,
          canonicalPath: cleanRoute,
          type: 'article',
          publishedTime: toIsoDate(resolution?.meeting_date),
          jsonLd: resolution ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title || id,
            description: desc,
            datePublished: toIsoDate(resolution.meeting_date),
            author: { '@id': `${SITE_URL}/#organization` },
            publisher: { '@id': `${SITE_URL}/#organization` },
            mainEntityOfPage: `${SITE_URL}${cleanRoute}/`,
          } : undefined,
        })
      }
      // MEETING DETAIL: /meetings/:ordinal/
      else if (isMeetingRoute(route)) {
        const ordinal = parseInt(parts[1], 10)
        const suffix = ((n: number) => {
          if (n >= 11 && n <= 13) return 'th'
          const r = n % 10
          if (r === 1) return 'st'
          if (r === 2) return 'nd'
          if (r === 3) return 'rd'
          return 'th'
        })(ordinal)
        const meetingsList = (() => {
          try { return readJson<any[]>('public/data/meetings.json') } catch { return [] }
        })()
        const m = meetingsList.find((x: any) => x.ordinal === ordinal)
        const yearPart = m?.year ? ` (${m.year})` : ''
        const hostPart = m?.primary?.country
          ? ` in ${[m.primary.city, m.primary.country].filter(Boolean).join(', ')}`
          : ''
        const desc = `The ${ordinal}${suffix} plenary meeting of ${COMMITTEE_NAME}${yearPart}${hostPart}. ${m?.resolution_count ? `${m.resolution_count} resolution${m.resolution_count === 1 ? '' : 's'} adopted.` : ''}`.trim()
        const startDate = toIsoDate(m?.primary?.start_date)
        const endDate = toIsoDate(m?.primary?.end_date)
        head = buildHead({
          title: `${ordinal}${suffix} Plenary Meeting${yearPart} | ${COMMITTEE_NAME}`,
          description: desc,
          canonicalPath: cleanRoute,
          type: 'article',
          publishedTime: startDate,
          jsonLd: m ? {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: `${ordinal}${suffix} plenary meeting of ${COMMITTEE_NAME}`,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            eventStatus: m.status_label === 'Cancelled'
              ? 'https://schema.org/EventCancelled'
              : (m.status_label === 'Concluded' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled'),
            eventAttendanceMode: m.type_label === 'Virtual'
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : (m.type_label === 'Hybrid' ? 'https://schema.org/MixedEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode'),
            location: m.primary?.city ? {
              '@type': 'Place',
              name: m.primary.city,
              address: { '@type': 'PostalAddress', addressCountry: m.primary.country || undefined },
            } : undefined,
            organizer: { '@id': `${SITE_URL}/#organization` },
            url: `${SITE_URL}${cleanRoute}/`,
          } : undefined,
        })
      }
      // SECTION LISTS + DETAIL PAGES
      else if (cleanRoute === '/resolutions') {
        head = buildHead({
          title: `Resolutions | ${COMMITTEE_NAME}`,
          description: `Search and browse resolutions adopted by ${COMMITTEE_NAME} since its first plenary.`,
          canonicalPath: '/resolutions/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Resolutions | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (cleanRoute === '/resolutions/meetings') {
        head = buildHead({
          title: `Meetings Timeline | Resolutions | ${COMMITTEE_NAME}`,
          description: `Browse ${COMMITTEE_NAME} resolutions grouped by plenary meeting and ballot.`,
          canonicalPath: '/resolutions/meetings/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Meetings Timeline | Resolutions | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'members' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Members | ${COMMITTEE_NAME}`,
          description: `${title} — expert contributing to ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
              '@type': 'Person',
              name: title,
              description: bodyDesc || `Member of ${COMMITTEE_NAME}`,
            },
          },
        })
      } else if (cleanRoute === '/members') {
        head = buildHead({
          title: `Members | ${COMMITTEE_NAME}`,
          description: `Experts from national bodies, liaisons, and the Committee Advisory Group of ${COMMITTEE_NAME}.`,
          canonicalPath: '/members/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Members | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'groups' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Groups | ${COMMITTEE_NAME}`,
          description: `${title} — a working, advisory, or maintenance group of ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@type': 'Organization', name: title, parentOrganization: { '@id': `${SITE_URL}/#organization` } },
          },
        })
      } else if (cleanRoute === '/groups') {
        head = buildHead({
          title: `Groups | ${COMMITTEE_NAME}`,
          description: `Working Groups, Advisory Groups, and Maintenance Agencies of ${COMMITTEE_NAME}.`,
          canonicalPath: '/groups/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Groups | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'standards' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Standards | ${COMMITTEE_NAME}`,
          description: `${title} — an International Standard published by ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Standard',
            name: title,
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
        })
      } else if (cleanRoute === '/standards') {
        head = buildHead({
          title: `Standards | ${COMMITTEE_NAME}`,
          description: `International Standards published by ${COMMITTEE_NAME} — processes, data elements and documents in commerce, industry and administration.`,
          canonicalPath: '/standards/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Standards | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'liaisons' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Liaisons | ${COMMITTEE_NAME}`,
          description: `${title} — an organization in liaison with ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@type': 'Organization', name: title },
          },
        })
      } else if (cleanRoute === '/liaisons') {
        head = buildHead({
          title: `Liaisons | ${COMMITTEE_NAME}`,
          description: `External organizations in liaison with ${COMMITTEE_NAME}.`,
          canonicalPath: '/liaisons/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Liaisons | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'national-bodies' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | National Bodies | ${COMMITTEE_NAME}`,
          description: `${title} — an ISO member body participating in ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@type': 'Organization', name: title, parentOrganization: { '@id': `${SITE_URL}/#organization` } },
          },
        })
      } else if (cleanRoute === '/national-bodies') {
        head = buildHead({
          title: `National Bodies | ${COMMITTEE_NAME}`,
          description: `National standards bodies participating in ${COMMITTEE_NAME}.`,
          canonicalPath: '/national-bodies/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `National Bodies | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'projects' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Projects | ${COMMITTEE_NAME}`,
          description: `${title} — a standard under development by ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@type': 'CreativeWork', name: title, author: { '@id': `${SITE_URL}/#organization` } },
          },
        })
      } else if (cleanRoute === '/projects') {
        head = buildHead({
          title: `Projects | ${COMMITTEE_NAME}`,
          description: `Standards under development by ${COMMITTEE_NAME}.`,
          canonicalPath: '/projects/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Projects | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (cleanRoute === '/meetings') {
        head = buildHead({
          title: `Plenary Meetings | ${COMMITTEE_NAME}`,
          description: `Every plenary meeting of ${COMMITTEE_NAME}, hosted annually by national bodies — venues, dates, resolutions, briefings.`,
          canonicalPath: '/meetings/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Plenary Meetings | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'posts' && parts.length === 2 && title) {
        const slug = parts[1]
        const postsList = (() => { try { return readJson<any[]>('public/data/posts.json') } catch { return [] } })()
        const post = postsList.find((p: any) => p.slug === slug)
        const published = post?.date || post?.frontmatter?.date
        head = buildHead({
          title: `${title} | News | ${COMMITTEE_NAME}`,
          description: bodyDesc || `${title} — announcement from ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          type: 'article',
          publishedTime: published,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: title,
            description: bodyDesc || `${title} — from ${COMMITTEE_NAME}`,
            datePublished: published,
            author: { '@id': `${SITE_URL}/#organization` },
            publisher: { '@id': `${SITE_URL}/#organization` },
            mainEntityOfPage: `${SITE_URL}${cleanRoute}/`,
          },
        })
      } else if (cleanRoute === '/posts') {
        head = buildHead({
          title: `News | ${COMMITTEE_NAME}`,
          description: `Publications, announcements, and obituaries from ${COMMITTEE_NAME}.`,
          canonicalPath: '/posts/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: `News | ${COMMITTEE_NAME}`,
            publisher: { '@id': `${SITE_URL}/#organization` },
            url: `${SITE_URL}/posts/`,
          },
        })
      } else if (cleanRoute === '/about') {
        head = buildHead({
          title: `About | ${COMMITTEE_NAME}`,
          description: `About ${COMMITTEE_NAME} — ${COMMITTEE_FULL.toLowerCase()}.`,
          canonicalPath: '/about/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `About | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@id': `${SITE_URL}/#organization` },
          },
        })
      } else if (cleanRoute === '/business-plan') {
        head = buildHead({
          title: `Business Plan | ${COMMITTEE_NAME}`,
          description: `Strategy, work programme, and operating context for ${COMMITTEE_NAME} — processes, data elements and documents in commerce, industry and administration.`,
          canonicalPath: '/business-plan/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Business Plan | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@id': `${SITE_URL}/#organization` },
          },
        })
      } else if (cleanRoute === '/history') {
        head = buildHead({
          title: `History | ${COMMITTEE_NAME}`,
          description: `Five decades of milestones for ${COMMITTEE_NAME} — chairs and secretariats, plenary meetings, published standards, and structural changes since 1972.`,
          canonicalPath: '/history/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `History | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@id': `${SITE_URL}/#organization` },
          },
        })
      } else if (cleanRoute === '/faq') {
        head = buildHead({
          title: `FAQ | ${COMMITTEE_NAME}`,
          description: `Frequently asked questions about ${COMMITTEE_NAME} standards and procedures.`,
          canonicalPath: '/faq/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (cleanRoute === '/procedures') {
        head = buildHead({
          title: `Procedures | ${COMMITTEE_NAME}`,
          description: `Operating procedures and submission processes of ${COMMITTEE_NAME}.`,
          canonicalPath: '/procedures/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Procedures | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (cleanRoute === '/contact') {
        head = buildHead({
          title: `Contact | ${COMMITTEE_NAME}`,
          description: `How to get in touch with ${COMMITTEE_NAME}.`,
          canonicalPath: '/contact/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (cleanRoute === '/acknowledgments') {
        head = buildHead({
          title: `Acknowledgments | ${COMMITTEE_NAME}`,
          description: `Errata reports, feedback, and improvements contributed to ${COMMITTEE_NAME} standards.`,
          canonicalPath: '/acknowledgments/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Acknowledgments | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else if (parts[0] === 'faq' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | FAQ | ${COMMITTEE_NAME}`,
          description: bodyDesc || `${title} — frequently asked question about ${COMMITTEE_NAME}.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Question',
            name: title,
            isPartOf: { '@id': `${SITE_URL}/faq/#faq-index` },
          },
        })
      } else if (parts[0] === 'procedures' && parts.length === 2 && title) {
        head = buildHead({
          title: `${title} | Procedures | ${COMMITTEE_NAME}`,
          description: bodyDesc || `${title} — ${COMMITTEE_NAME} procedure.`,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${title} | Procedures | ${COMMITTEE_NAME}`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      } else {
        head = buildHead({
          title: title ? `${title} | ${COMMITTEE_NAME}` : COMMITTEE_NAME,
          description: bodyDesc || COMMITTEE_FULL,
          canonicalPath: `${cleanRoute}/`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title || COMMITTEE_NAME,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        })
      }

      if (head) {
        html = injectMeta(html, head, { stripExistingDescription: true })
      }

      return html
    },
  },
})
