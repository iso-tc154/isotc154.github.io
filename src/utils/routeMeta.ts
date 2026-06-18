import type { Resolution } from '../types/resolution'
import type { Member } from '../types/member'
import type { Group } from '../types/group'
import type { Standard } from '../types/standard'
import type { Project } from '../types/project'
import type { Liaison, NationalBody } from '../types/organization'
import type { Post, PageDoc } from '../types/content'
import type { Meeting } from '../types/meeting'
import {
  SITE_CONFIG,
  type SeoMeta,
  type SiteConfig,
  organizationJsonLd,
  websiteJsonLd,
} from './seo'

export interface RouteMetaContext {
  resolutions: Resolution[]
  members: { all: Record<string, Member> }
  groups: Group[]
  standards: Standard[]
  liaisons: Liaison[]
  nationalBodies: NationalBody[]
  projects: Project[]
  meetings: Meeting[]
  posts: Post[]
  pages: PageDoc[]
}

export function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th'
  const r = n % 10
  if (r === 1) return 'st'
  if (r === 2) return 'nd'
  if (r === 3) return 'rd'
  return 'th'
}

function titleParts(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' — ').trim()
}

function isResolutionDetailRoute(route: string): boolean {
  const parts = route.replace(/\/+$/, '').split('/')
  return parts.length === 5 && parts[1] === 'resolutions' && parts[2] !== 'meetings'
}

function isMeetingRoute(route: string): boolean {
  const parts = route.replace(/\/+$/, '').split('/')
  return parts.length === 3 && parts[1] === 'meetings' && /^\d+$/.test(parts[2])
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function firstParagraph(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  return m ? stripHtml(m[1]) : ''
}

export function computeRouteMeta(
  route: string,
  ctx: RouteMetaContext,
  cfg: SiteConfig = SITE_CONFIG,
): SeoMeta {
  const cleanRoute = route.replace(/\/+$/, '') || '/'
  const parts = cleanRoute.split('/').filter(Boolean)
  const { committeeName: name, committeeFull: full } = cfg

  const home: SeoMeta = {
    title: `${name} — Processes, data elements and documents in commerce, industry and administration`,
    description: `${full}. Browse ISO/TC 154 standards, plenary meetings, resolutions, and members.`,
    canonicalPath: '/',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [organizationJsonLd(cfg), websiteJsonLd(cfg)],
    },
    breadcrumbs: [{ name: 'Home', path: '/' }],
  }
  if (cleanRoute === '/') return home

  const collectionPage = (
    path: string,
    title: string,
    description: string,
    breadcrumbs: { name: string; path: string }[],
  ): SeoMeta => ({
    title: `${title} | ${name}`,
    description,
    canonicalPath: `${path}/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${title} | ${name}`,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
    breadcrumbs,
  })

  if (cleanRoute === '/resolutions') {
    return collectionPage(
      '/resolutions',
      'Resolutions',
      `Search and browse resolutions adopted by ${name} since its first plenary.`,
      [{ name: 'Home', path: '/' }, { name: 'Resolutions', path: '/resolutions/' }],
    )
  }
  if (cleanRoute === '/resolutions/meetings') {
    return collectionPage(
      '/resolutions/meetings',
      'Meetings Timeline',
      `Browse ${name} resolutions grouped by plenary meeting and ballot.`,
      [
        { name: 'Home', path: '/' },
        { name: 'Resolutions', path: '/resolutions/' },
        { name: 'Meetings', path: '/resolutions/meetings/' },
      ],
    )
  }

  if (isResolutionDetailRoute(route)) {
    const [sourceType, sourceFile, id] = [parts[1], parts[2], parts[3]]
    const res = ctx.resolutions.find(
      (r) => r.source_type === sourceType && r.source_file === sourceFile && r.id === id,
    )
    const headline = res?.title || `Resolution ${id}`
    const desc =
      res?.snippet ||
      res?.subject ||
      `${headline} — resolution adopted by ${name}.`
    return {
      title: `${headline} | Resolutions | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: res?.meeting_date,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Resolutions', path: '/resolutions/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: res
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline,
            description: desc,
            datePublished: res.meeting_date,
            author: { '@id': `${cfg.siteUrl}/#organization` },
            publisher: { '@id': `${cfg.siteUrl}/#organization` },
            mainEntityOfPage: `${cfg.siteUrl}${cleanRoute}/`,
            keywords: [res.subject, res.year].filter(Boolean).join(', '),
          }
        : undefined,
    }
  }

  if (isMeetingRoute(route)) {
    const ordinal = parseInt(parts[1], 10)
    const m = ctx.meetings.find((x) => x.ordinal === ordinal)
    const suffix = ordinalSuffix(ordinal)
    const yearPart = m?.year ? ` (${m.year})` : ''
    const hostPart = m?.primary?.country
      ? ` in ${[m.primary.city, m.primary.country].filter(Boolean).join(', ')}`
      : ''
    const headline = `${ordinal}${suffix} Plenary Meeting${yearPart}`
    const desc = `The ${ordinal}${suffix} plenary meeting of ${name}${yearPart}${hostPart}. ${m?.resolution_count ? `${m.resolution_count} resolution${m.resolution_count === 1 ? '' : 's'} adopted.` : ''}`.trim()
    const startDate = m?.primary?.start_date || undefined
    const endDate = m?.primary?.end_date || undefined
    return {
      title: `${headline} | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: startDate,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Meetings', path: '/meetings/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: m
        ? {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: `${ordinal}${suffix} plenary meeting of ${name}`,
            startDate,
            endDate,
            eventStatus:
              m.status_label === 'Cancelled'
                ? 'https://schema.org/EventCancelled'
                : m.status_label === 'Concluded'
                  ? 'https://schema.org/EventCompleted'
                  : 'https://schema.org/EventScheduled',
            eventAttendanceMode:
              m.type_label === 'Virtual'
                ? 'https://schema.org/OnlineEventAttendanceMode'
                : m.type_label === 'Hybrid'
                  ? 'https://schema.org/MixedEventAttendanceMode'
                  : 'https://schema.org/OfflineEventAttendanceMode',
            location: m.primary?.city
              ? {
                  '@type': 'Place',
                  name: m.primary.city,
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: m.primary.country || undefined,
                  },
                }
              : undefined,
            organizer: { '@id': `${cfg.siteUrl}/#organization` },
            url: `${cfg.siteUrl}${cleanRoute}/`,
          }
        : undefined,
    }
  }

  if (parts[0] === 'members' && parts.length === 2) {
    const member = ctx.members.all[parts[1]]
    const headline = member?.name || parts[1]
    const desc = member?.bio
      ? stripHtml(firstParagraph(member.bio) || member.bio).slice(0, 160)
      : `${headline} — expert contributing to ${name}.`
    return {
      title: `${headline} | Members | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      image: member?.picture,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Members', path: '/members/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: headline,
          description: desc,
          image: member?.picture
            ? `${cfg.siteUrl}${member.picture}`
            : undefined,
          worksFor: member?.affiliation
            ? { '@type': 'Organization', name: member.affiliation }
            : undefined,
        },
      },
    }
  }
  if (cleanRoute === '/members') {
    return collectionPage(
      '/members',
      'Members',
      `Experts from national bodies, liaisons, and the Committee Advisory Group of ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'Members', path: '/members/' }],
    )
  }

  if (parts[0] === 'groups' && parts.length === 2) {
    const group = ctx.groups.find((g) => g.id === parts[1])
    const headline = group?.title || group?.name || parts[1]
    const desc = group?.scope
      ? stripHtml(group.scope).slice(0, 160)
      : `${headline} — a working, advisory, or maintenance group of ${name}.`
    return {
      title: `${headline} | Groups | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Groups', path: '/groups/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: {
          '@type': 'Organization',
          name: headline,
          parentOrganization: { '@id': `${cfg.siteUrl}/#organization` },
        },
      },
    }
  }
  if (cleanRoute === '/groups') {
    return collectionPage(
      '/groups',
      'Groups',
      `Working Groups, Advisory Groups, and Maintenance Agencies of ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'Groups', path: '/groups/' }],
    )
  }

  if (parts[0] === 'standards' && parts.length === 2) {
    const std = ctx.standards.find((s) => s.id === parts[1])
    const headline = std?.iso?.title || std?.iso?.name || parts[1]
    const desc = std?.iso?.scope
      ? stripHtml(std.iso.scope).slice(0, 160)
      : `${headline} — an International Standard published by ${name}.`
    return {
      title: `${headline} | Standards | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: std?.iso?.publication_date,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Standards', path: '/standards/' },
        { name: std?.iso?.name || headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Standard',
        name: headline,
        alternateName: std?.iso?.name,
        identifier: std?.iso?.name,
        datePublished: std?.iso?.publication_date,
        icsCode: std?.iso?.ics,
        publisher: { '@id': `${cfg.siteUrl}/#organization` },
        url: `${cfg.siteUrl}${cleanRoute}/`,
      },
    }
  }
  if (cleanRoute === '/standards') {
    return collectionPage(
      '/standards',
      'Standards',
      `International Standards published by ${name} — processes, data elements and documents in commerce, industry and administration.`,
      [{ name: 'Home', path: '/' }, { name: 'Standards', path: '/standards/' }],
    )
  }

  if (parts[0] === 'liaisons' && parts.length === 2) {
    const lia = ctx.liaisons.find((l) => l.id === parts[1])
    const headline = lia?.name || parts[1]
    const desc = lia?.description
      ? stripHtml(lia.description).slice(0, 160)
      : `${headline} — an organization in liaison with ${name}.`
    return {
      title: `${headline} | Liaisons | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Liaisons', path: '/liaisons/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: { '@type': 'Organization', name: headline },
      },
    }
  }
  if (cleanRoute === '/liaisons') {
    return collectionPage(
      '/liaisons',
      'Liaisons',
      `External organizations in liaison with ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'Liaisons', path: '/liaisons/' }],
    )
  }

  if (parts[0] === 'national-bodies' && parts.length === 2) {
    const nb = ctx.nationalBodies.find((x) => x.id === parts[1])
    const headline = nb?.name || parts[1]
    const desc = nb?.description
      ? stripHtml(nb.description).slice(0, 160)
      : `${headline} — an ISO member body participating in ${name}.`
    return {
      title: `${headline} | National Bodies | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'National Bodies', path: '/national-bodies/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: {
          '@type': 'Organization',
          name: headline,
          parentOrganization: { '@id': `${cfg.siteUrl}/#organization` },
        },
      },
    }
  }
  if (cleanRoute === '/national-bodies') {
    return collectionPage(
      '/national-bodies',
      'National Bodies',
      `National standards bodies participating in ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'National Bodies', path: '/national-bodies/' }],
    )
  }

  if (parts[0] === 'projects' && parts.length === 2) {
    const project = ctx.projects.find((p) => p.id === parts[1])
    const headline = project?.title || parts[1]
    const desc = `${headline} — a standard under development by ${name}.`
    return {
      title: `${headline} | Projects | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/projects/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: {
          '@type': 'CreativeWork',
          name: headline,
          author: { '@id': `${cfg.siteUrl}/#organization` },
        },
      },
    }
  }
  if (cleanRoute === '/projects') {
    return collectionPage(
      '/projects',
      'Projects',
      `Standards under development by ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects/' }],
    )
  }

  if (cleanRoute === '/meetings') {
    return collectionPage(
      '/meetings',
      'Plenary Meetings',
      `Every plenary meeting of ${name}, hosted annually by national bodies — venues, dates, resolutions, briefings.`,
      [{ name: 'Home', path: '/' }, { name: 'Meetings', path: '/meetings/' }],
    )
  }

  if (parts[0] === 'posts' && parts.length === 2) {
    const post = ctx.posts.find((p) => p.slug === parts[1])
    const headline = post?.frontmatter?.title || parts[1]
    const desc = post?.frontmatter?.excerpt
      ? stripHtml(post.frontmatter.excerpt).slice(0, 160)
      : post?.html
        ? firstParagraph(post.html).slice(0, 160) || `${headline} — announcement from ${name}.`
        : `${headline} — announcement from ${name}.`
    return {
      title: `${headline} | News | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: post?.date,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'News', path: '/posts/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline,
        description: desc,
        datePublished: post?.date,
        author: { '@id': `${cfg.siteUrl}/#organization` },
        publisher: { '@id': `${cfg.siteUrl}/#organization` },
        mainEntityOfPage: `${cfg.siteUrl}${cleanRoute}/`,
      },
    }
  }
  if (cleanRoute === '/posts') {
    return collectionPage(
      '/posts',
      'News',
      `Publications, announcements, and obituaries from ${name}.`,
      [{ name: 'Home', path: '/' }, { name: 'News', path: '/posts/' }],
    )
  }

  const staticPage = (
    path: string,
    label: string,
    description: string,
    type = 'WebPage' as string,
  ): SeoMeta => ({
    title: `${label} | ${name}`,
    description,
    canonicalPath: `${path}/`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: label, path: `${path}/` }],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': type,
      name: `${label} | ${name}`,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      about: { '@id': `${cfg.siteUrl}/#organization` },
    },
  })

  if (cleanRoute === '/about') {
    return staticPage('/about', 'About', `About ${name} — ${full.toLowerCase()}.`, 'AboutPage')
  }
  if (cleanRoute === '/business-plan') {
    return staticPage(
      '/business-plan',
      'Business Plan',
      `Strategy, work programme, and operating context for ${name} — processes, data elements and documents in commerce, industry and administration.`,
    )
  }
  if (cleanRoute === '/history') {
    return staticPage(
      '/history',
      'History',
      `Five decades of milestones for ${name} — chairs and secretariats, plenary meetings, published standards, and structural changes since 1972.`,
      'CollectionPage',
    )
  }
  if (cleanRoute === '/faq') {
    return {
      title: `FAQ | ${name}`,
      description: `Frequently asked questions about ${name} standards and procedures.`,
      canonicalPath: '/faq/',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq/' }],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  }
  if (cleanRoute === '/procedures') {
    return staticPage('/procedures', 'Procedures', `Operating procedures and submission processes of ${name}.`)
  }
  if (cleanRoute === '/contact') {
    return {
      title: `Contact | ${name}`,
      description: `How to get in touch with ${name}.`,
      canonicalPath: '/contact/',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact/' }],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  }
  if (cleanRoute === '/acknowledgments') {
    return staticPage(
      '/acknowledgments',
      'Acknowledgments',
      `Errata reports, feedback, and improvements contributed to ${name} standards.`,
    )
  }

  if (parts[0] === 'faq' && parts.length === 2) {
    const faqPage = ctx.pages.find((p) => p.slug === parts[1])
    const headline = faqPage?.frontmatter?.title || parts[1]
    const desc = faqPage?.html
      ? firstParagraph(faqPage.html).slice(0, 160)
      : `${headline} — frequently asked question about ${name}.`
    return {
      title: `${headline} | FAQ | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'FAQ', path: '/faq/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Question',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/faq/#faq-index` },
      },
    }
  }

  if (parts[0] === 'procedures' && parts.length === 2) {
    const procPage = ctx.pages.find((p) => p.slug === parts[1] || p.slug?.endsWith(`/${parts[1]}`))
    const headline = procPage?.frontmatter?.title || parts[1]
    const desc = procPage?.html
      ? firstParagraph(procPage.html).slice(0, 160)
      : `${headline} — ${name} procedure.`
    return {
      title: `${headline} | Procedures | ${name}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Procedures', path: '/procedures/' },
        { name: headline, path: `${cleanRoute}/` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${headline} | Procedures | ${name}`,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  }

  // Generic page lookup (AsciiDoc pages, agenda, etc.)
  const genericPage =
    ctx.pages.find((p) => p.url === `${cleanRoute}/` || p.frontmatter?.permalink === `${cleanRoute}/`) ||
    ctx.pages.find((p) => p.slug === parts[parts.length - 1])
  const genericHeadline = genericPage?.frontmatter?.title
  const genericDesc = genericPage?.html
    ? firstParagraph(genericPage.html).slice(0, 160)
    : undefined

  return {
    title: genericHeadline ? `${genericHeadline} | ${name}` : titleParts(name) || name,
    description: genericDesc || full,
    canonicalPath: `${cleanRoute}/`,
    breadcrumbs: genericHeadline
      ? [{ name: 'Home', path: '/' }, { name: genericHeadline, path: `${cleanRoute}/` }]
      : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: genericHeadline || name,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
  }
}
