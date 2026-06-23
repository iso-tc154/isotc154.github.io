import type { Resolution } from '../types/resolution'
import type { Member } from '../types/member'
import type { Group } from '../types/group'
import type { Standard } from '../types/standard'
import type { Project } from '../types/project'
import type { Liaison, NationalBody } from '../types/organization'
import type { Post, PageDoc } from '../types/content'
import type { Meeting } from '../types/meeting'
import type { SeoMeta, SiteConfig } from '../utils/seo'
import { stripHtml } from '../utils/seo'
import { ordinalSuffix } from '../utils/ordinal'

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

export type RouteMetaEntity = keyof RouteMetaContext

export interface DetailMatcher {
  predicate: (parts: string[]) => boolean
  entityKind?: RouteMetaEntity
  hydrate: (
    parts: string[],
    cleanRoute: string,
    ctx: RouteMetaContext,
    cfg: SiteConfig,
  ) => SeoMeta
}

const crumb = (name: string, path: string) => ({ name, path })
const HOME = () => crumb('Home', '/')

function firstParagraph(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  return m ? stripHtml(m[1]) : ''
}

function titleParts(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' — ').trim()
}

const resolutionDetail: DetailMatcher = {
  predicate: (parts) =>
    parts.length === 4 && parts[0] === 'resolutions' && parts[1] !== 'meetings',
  entityKind: 'resolutions',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const [, sourceType, sourceFile, id] = parts
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
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: res?.meeting_date,
      breadcrumbs: [HOME(), crumb('Resolutions', '/resolutions/'), crumb(headline, `${cleanRoute}/`)],
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
  },
}

const meetingDetail: DetailMatcher = {
  predicate: (parts) =>
    parts.length === 2 && parts[0] === 'meetings' && /^\d+$/.test(parts[1]),
  entityKind: 'meetings',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const ordinal = parseInt(parts[1], 10)
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
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: startDate,
      breadcrumbs: [HOME(), crumb('Meetings', '/meetings/'), crumb(headline, `${cleanRoute}/`)],
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
            url: `${cfg.siteUrl}${cleanRoute}/`,
          }
        : undefined,
    }
  },
}

const memberDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'members',
  entityKind: 'members',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const member = ctx.members.all[parts[1]]
    const headline = member?.name || parts[1]
    const desc = member?.bio
      ? stripHtml(firstParagraph(member.bio) || member.bio).slice(0, 160)
      : `${headline} — expert contributing to ${cfg.committeeName}.`
    return {
      title: `${headline} | Members | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      image: member?.picture,
      breadcrumbs: [HOME(), crumb('Members', '/members/'), crumb(headline, `${cleanRoute}/`)],
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
}

const groupDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'groups',
  entityKind: 'groups',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const group = ctx.groups.find((g) => g.id === parts[1])
    const headline = group?.title || group?.name || parts[1]
    const desc = group?.scope
      ? stripHtml(group.scope).slice(0, 160)
      : `${headline} — a working, advisory, or maintenance group of ${cfg.committeeName}.`
    return {
      title: `${headline} | Groups | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('Groups', '/groups/'), crumb(headline, `${cleanRoute}/`)],
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
}

const standardDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'standards',
  entityKind: 'standards',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const std = ctx.standards.find((s) => s.id === parts[1])
    const headline = std?.iso?.title || std?.iso?.name || parts[1]
    const desc = std?.iso?.scope
      ? stripHtml(std.iso.scope).slice(0, 160)
      : `${headline} — an International Standard published by ${cfg.committeeName}.`
    return {
      title: `${headline} | Standards | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: std?.iso?.publication_date,
      breadcrumbs: [HOME(), crumb('Standards', '/standards/'), crumb(std?.iso?.name || headline, `${cleanRoute}/`)],
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
  },
}

const liaisonDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'liaisons',
  entityKind: 'liaisons',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const lia = ctx.liaisons.find((l) => l.id === parts[1])
    const headline = lia?.name || parts[1]
    const desc = lia?.description
      ? stripHtml(lia.description).slice(0, 160)
      : `${headline} — an organization in liaison with ${cfg.committeeName}.`
    return {
      title: `${headline} | Liaisons | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('Liaisons', '/liaisons/'), crumb(headline, `${cleanRoute}/`)],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: { '@type': 'Organization', name: headline },
      },
    }
  },
}

const nationalBodyDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'national-bodies',
  entityKind: 'nationalBodies',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const nb = ctx.nationalBodies.find((x) => x.id === parts[1])
    const headline = nb?.name || parts[1]
    const desc = nb?.description
      ? stripHtml(nb.description).slice(0, 160)
      : `${headline} — an ISO member body participating in ${cfg.committeeName}.`
    return {
      title: `${headline} | National Bodies | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('National Bodies', '/national-bodies/'), crumb(headline, `${cleanRoute}/`)],
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
}

const projectDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'projects',
  entityKind: 'projects',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const project = ctx.projects.find((p) => p.id === parts[1])
    const headline = project?.title || parts[1]
    const desc = `${headline} — a standard under development by ${cfg.committeeName}.`
    return {
      title: `${headline} | Projects | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('Projects', '/projects/'), crumb(headline, `${cleanRoute}/`)],
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
}

const postDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'posts',
  entityKind: 'posts',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const post = ctx.posts.find((p) => p.slug === parts[1])
    const headline = post?.frontmatter?.title || parts[1]
    const desc = post?.frontmatter?.excerpt
      ? stripHtml(post.frontmatter.excerpt).slice(0, 160)
      : post?.html
        ? firstParagraph(post.html).slice(0, 160) || `${headline} — announcement from ${cfg.committeeName}.`
        : `${headline} — announcement from ${cfg.committeeName}.`
    return {
      title: `${headline} | News | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      type: 'article',
      publishedTime: post?.date,
      breadcrumbs: [HOME(), crumb('News', '/posts/'), crumb(headline, `${cleanRoute}/`)],
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
  },
}

const faqDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'faq',
  entityKind: 'pages',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const faqPage = ctx.pages.find((p) => p.slug === parts[1])
    const headline = faqPage?.frontmatter?.title || parts[1]
    const desc = faqPage?.html
      ? firstParagraph(faqPage.html).slice(0, 160)
      : `${headline} — frequently asked question about ${cfg.committeeName}.`
    return {
      title: `${headline} | FAQ | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('FAQ', '/faq/'), crumb(headline, `${cleanRoute}/`)],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Question',
        name: headline,
        isPartOf: { '@id': `${cfg.siteUrl}/faq/#faq-index` },
      },
    }
  },
}

const proceduresDetail: DetailMatcher = {
  predicate: (parts) => parts.length === 2 && parts[0] === 'procedures',
  entityKind: 'pages',
  hydrate: (parts, cleanRoute, ctx, cfg) => {
    const procPage = ctx.pages.find((p) => p.slug === parts[1] || p.slug?.endsWith(`/${parts[1]}`))
    const headline = procPage?.frontmatter?.title || parts[1]
    const desc = procPage?.html
      ? firstParagraph(procPage.html).slice(0, 160)
      : `${headline} — ${cfg.committeeName} procedure.`
    return {
      title: `${headline} | Procedures | ${cfg.committeeName}`,
      description: desc,
      canonicalPath: `${cleanRoute}/`,
      breadcrumbs: [HOME(), crumb('Procedures', '/procedures/'), crumb(headline, `${cleanRoute}/`)],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${headline} | Procedures | ${cfg.committeeName}`,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  },
}

export const DETAIL_MATCHERS: DetailMatcher[] = [
  resolutionDetail,
  meetingDetail,
  memberDetail,
  groupDetail,
  standardDetail,
  liaisonDetail,
  nationalBodyDetail,
  projectDetail,
  postDetail,
  faqDetail,
  proceduresDetail,
]

export function genericPageHydrate(
  parts: string[],
  cleanRoute: string,
  ctx: RouteMetaContext,
  cfg: SiteConfig,
): SeoMeta {
  const genericPage =
    ctx.pages.find((p) => p.url === `${cleanRoute}/` || p.frontmatter?.permalink === `${cleanRoute}/`) ||
    ctx.pages.find((p) => p.slug === parts[parts.length - 1])
  const headline = genericPage?.frontmatter?.title
  const desc = genericPage?.html ? firstParagraph(genericPage.html).slice(0, 160) : undefined

  return {
    title: headline ? `${headline} | ${cfg.committeeName}` : titleParts(cfg.committeeName) || cfg.committeeName,
    description: desc || cfg.committeeFull,
    canonicalPath: `${cleanRoute}/`,
    breadcrumbs: headline
      ? [HOME(), crumb(headline, `${cleanRoute}/`)]
      : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: headline || cfg.committeeName,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
  }
}
