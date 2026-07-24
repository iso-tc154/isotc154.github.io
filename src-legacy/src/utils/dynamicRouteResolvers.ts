import type { Resolution } from '../types/resolution'
import type { Member } from '../types/member'
import type { Group } from '../types/group'
import type { Standard } from '../types/standard'
import type { Project } from '../types/project'
import type { Liaison, NationalBody } from '../types/organization'
import type { Post, PageDoc } from '../types/content'
import type { Meeting } from '../types/meeting'
import { ordinalSuffix } from './ordinal'
import { type SeoMeta, type SiteConfig } from './seo'

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

export interface DynamicRouteResolver {
  // Returns true if this resolver owns the route. `parts` is cleanRoute with
  // empty segments filtered out (so '/members/jane/' → ['members', 'jane']).
  matches: (parts: string[]) => boolean
  resolve: (parts: string[], ctx: RouteMetaContext, cfg: SiteConfig) => SeoMeta
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function firstParagraph(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  return m ? stripHtml(m[1]) : ''
}

function canonical(parts: string[]): string {
  return `/${parts.join('/')}/`
}

function homeCrumb(): { name: string; path: string } {
  return { name: 'Home', path: '/' }
}

const resolvers: DynamicRouteResolver[] = [
  {
    // /resolutions/:sourceType/:sourceFile/:id/ — but NOT /resolutions/meetings/...
    matches: (p) =>
      p.length === 4 && p[0] === 'resolutions' && p[1] !== 'meetings',
    resolve: (p, ctx, cfg) => {
      const [sourceType, sourceFile, id] = [p[1], p[2], p[3]]
      const cleanRoute = canonical(p)
      const res = ctx.resolutions.find(
        (r) => r.source_type === sourceType && r.source_file === sourceFile && r.id === id,
      )
      const headline = res?.title || `Resolution ${id}`
      const desc =
        res?.snippet ||
        res?.subject ||
        `${headline} — resolution adopted by ${cfg.committeeName}.`
      return {
        title: `${headline} | Resolutions | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        type: 'article',
        publishedTime: res?.meeting_date,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Resolutions', path: '/resolutions/' },
          { name: headline, path: cleanRoute },
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
              mainEntityOfPage: `${cfg.siteUrl}${cleanRoute}`,
              keywords: [res.subject, res.year].filter(Boolean).join(', '),
            }
          : undefined,
      }
    },
  },
  {
    // /meetings/:ordinal/
    matches: (p) => p.length === 2 && p[0] === 'meetings' && /^\d+$/.test(p[1]),
    resolve: (p, ctx, cfg) => {
      const ordinal = parseInt(p[1], 10)
      const cleanRoute = canonical(p)
      const m = ctx.meetings.find((x) => x.ordinal === ordinal)
      const suffix = ordinalSuffix(ordinal)
      const yearPart = m?.year ? ` (${m.year})` : ''
      const hostPart = m?.primary?.country
        ? ` in ${[m.primary.city, m.primary.country].filter(Boolean).join(', ')}`
        : ''
      const headline = `${ordinal}${suffix} Plenary Meeting${yearPart}`
      const desc = `The ${ordinal}${suffix} plenary meeting of ${cfg.committeeName}${yearPart}${hostPart}. ${m?.resolution_count ? `${m.resolution_count} resolution${m.resolution_count === 1 ? '' : 's'} adopted.` : ''}`.trim()
      const startDate = m?.primary?.start_date || undefined
      const endDate = m?.primary?.end_date || undefined
      return {
        title: `${headline} | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        type: 'article',
        publishedTime: startDate,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Meetings', path: '/meetings/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: m
          ? {
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: `${ordinal}${suffix} plenary meeting of ${cfg.committeeName}`,
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
              url: `${cfg.siteUrl}${cleanRoute}`,
            }
          : undefined,
      }
    },
  },
  {
    // /members/:id/
    matches: (p) => p.length === 2 && p[0] === 'members',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const member = ctx.members.all[p[1]]
      const headline = member?.name || p[1]
      const desc = member?.bio
        ? stripHtml(firstParagraph(member.bio) || member.bio).slice(0, 160)
        : `${headline} — expert contributing to ${cfg.committeeName}.`
      return {
        title: `${headline} | Members | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        type: 'article',
        image: member?.picture,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Members', path: '/members/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: headline,
            description: desc,
            image: member?.picture ? `${cfg.siteUrl}${member.picture}` : undefined,
            worksFor: member?.affiliation
              ? { '@type': 'Organization', name: member.affiliation }
              : undefined,
          },
        },
      }
    },
  },
  {
    // /groups/:id/
    matches: (p) => p.length === 2 && p[0] === 'groups',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const group = ctx.groups.find((g) => g.id === p[1])
      const headline = group?.title || group?.name || p[1]
      const desc = group?.scope
        ? stripHtml(group.scope).slice(0, 160)
        : `${headline} — a working, advisory, or maintenance group of ${cfg.committeeName}.`
      return {
        title: `${headline} | Groups | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Groups', path: '/groups/' },
          { name: headline, path: cleanRoute },
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
    },
  },
  {
    // /standards/:id/
    matches: (p) => p.length === 2 && p[0] === 'standards',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const std = ctx.standards.find((s) => s.id === p[1])
      const headline = std?.iso?.title || std?.iso?.name || p[1]
      const desc = std?.iso?.scope
        ? stripHtml(std.iso.scope).slice(0, 160)
        : `${headline} — an International Standard published by ${cfg.committeeName}.`
      return {
        title: `${headline} | Standards | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        type: 'article',
        publishedTime: std?.iso?.publication_date,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Standards', path: '/standards/' },
          { name: std?.iso?.name || headline, path: cleanRoute },
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
          url: `${cfg.siteUrl}${cleanRoute}`,
        },
      }
    },
  },
  {
    // /liaisons/:id/
    matches: (p) => p.length === 2 && p[0] === 'liaisons',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const lia = ctx.liaisons.find((l) => l.id === p[1])
      const headline = lia?.name || p[1]
      const desc = lia?.description
        ? stripHtml(lia.description).slice(0, 160)
        : `${headline} — an organization in liaison with ${cfg.committeeName}.`
      return {
        title: `${headline} | Liaisons | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Liaisons', path: '/liaisons/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: headline,
          isPartOf: { '@id': `${cfg.siteUrl}/#website` },
          about: { '@type': 'Organization', name: headline },
        },
      }
    },
  },
  {
    // /national-bodies/:id/
    matches: (p) => p.length === 2 && p[0] === 'national-bodies',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const nb = ctx.nationalBodies.find((x) => x.id === p[1])
      const headline = nb?.name || p[1]
      const desc = nb?.description
        ? stripHtml(nb.description).slice(0, 160)
        : `${headline} — an ISO member body participating in ${cfg.committeeName}.`
      return {
        title: `${headline} | National Bodies | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'National Bodies', path: '/national-bodies/' },
          { name: headline, path: cleanRoute },
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
    },
  },
  {
    // /projects/:id/
    matches: (p) => p.length === 2 && p[0] === 'projects',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const project = ctx.projects.find((pr) => pr.id === p[1])
      const headline = project?.title || p[1]
      const desc = `${headline} — a standard under development by ${cfg.committeeName}.`
      return {
        title: `${headline} | Projects | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Projects', path: '/projects/' },
          { name: headline, path: cleanRoute },
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
    },
  },
  {
    // /posts/:slug/
    matches: (p) => p.length === 2 && p[0] === 'posts',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const post = ctx.posts.find((ps) => ps.slug === p[1])
      const headline = post?.frontmatter?.title || p[1]
      const desc = post?.frontmatter?.excerpt
        ? stripHtml(post.frontmatter.excerpt).slice(0, 160)
        : post?.html
          ? firstParagraph(post.html).slice(0, 160) || `${headline} — announcement from ${cfg.committeeName}.`
          : `${headline} — announcement from ${cfg.committeeName}.`
      return {
        title: `${headline} | News | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        type: 'article',
        publishedTime: post?.date,
        breadcrumbs: [
          homeCrumb(),
          { name: 'News', path: '/posts/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline,
          description: desc,
          datePublished: post?.date,
          author: { '@id': `${cfg.siteUrl}/#organization` },
          publisher: { '@id': `${cfg.siteUrl}/#organization` },
          mainEntityOfPage: `${cfg.siteUrl}${cleanRoute}`,
        },
      }
    },
  },
  {
    // /faq/:slug/
    matches: (p) => p.length === 2 && p[0] === 'faq',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const faqPage = ctx.pages.find((pg) => pg.slug === p[1])
      const headline = faqPage?.frontmatter?.title || p[1]
      const desc = faqPage?.html
        ? firstParagraph(faqPage.html).slice(0, 160)
        : `${headline} — frequently asked question about ${cfg.committeeName}.`
      return {
        title: `${headline} | FAQ | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'FAQ', path: '/faq/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Question',
          name: headline,
          isPartOf: { '@id': `${cfg.siteUrl}/faq/#faq-index` },
        },
      }
    },
  },
  {
    // /procedures/:slug/
    matches: (p) => p.length === 2 && p[0] === 'procedures',
    resolve: (p, ctx, cfg) => {
      const cleanRoute = canonical(p)
      const procPage = ctx.pages.find(
        (pg) => pg.slug === p[1] || pg.slug?.endsWith(`/${p[1]}`),
      )
      const headline = procPage?.frontmatter?.title || p[1]
      const desc = procPage?.html
        ? firstParagraph(procPage.html).slice(0, 160)
        : `${headline} — ${cfg.committeeName} procedure.`
      return {
        title: `${headline} | Procedures | ${cfg.committeeName}`,
        description: desc,
        canonicalPath: cleanRoute,
        breadcrumbs: [
          homeCrumb(),
          { name: 'Procedures', path: '/procedures/' },
          { name: headline, path: cleanRoute },
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${headline} | Procedures | ${cfg.committeeName}`,
          isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        },
      }
    },
  },
]

export const DYNAMIC_ROUTE_RESOLVERS: DynamicRouteResolver[] = resolvers

export function findDynamicResolver(parts: string[]): DynamicRouteResolver | undefined {
  return resolvers.find((r) => r.matches(parts))
}
