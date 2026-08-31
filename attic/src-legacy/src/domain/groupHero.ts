import type { ConvenorSeat, ConvenorTerm, Group } from '../types/group'
import type { HeroPerson, ProjectCard, StandardCard } from '../composables/useGroupRoster'

// GroupHero prop bundle — derived from a group + roster. Extracted from
// GroupDetailView as a pure transformation so the hero contract (which
// people to show, which label, which seats) is testable without rendering.
//
// `RosterLike` is a narrow slice of useGroupRoster's return — just the
// methods this resolver calls. Tests can pass a stub object with these
// methods; production passes the real composable.
export interface RosterLike {
  heroPeople: (ids: string[], terms?: ConvenorTerm[]) => HeroPerson[]
  standardCardsFor: (raws: string[]) => StandardCard[]
  projectCardsFor: (ids: string[]) => ProjectCard[]
}

export interface GroupHeroData {
  heroConvenors: HeroPerson[]
  heroConvenorLabel: string
  heroManagers: HeroPerson[]
  heroSecretaries: HeroPerson[]
  convenorSeats?: { label: string; people: HeroPerson[] }[]
  standardCards: StandardCard[]
  projectCards: ProjectCard[]
}

function resolveConvenorSeats(
  seats: ConvenorSeat[] | undefined,
  convenorTerms: ConvenorTerm[],
  roster: RosterLike,
): { label: string; people: HeroPerson[] }[] | undefined {
  if (!seats?.length) return undefined
  return seats.map(seat => ({
    label: seat.label,
    people: roster.heroPeople(seat.member_ids, convenorTerms),
  }))
}

export function resolveGroupHeroData(
  group: Group,
  roster: RosterLike,
  convenorTerms: ConvenorTerm[],
): GroupHeroData {
  const convenors = group.convenors ?? group.organization?.convenors ?? []
  const coChairs = group.co_chairs ?? group.organization?.co_chairs ?? []
  const managers = group.managers ?? group.organization?.managers ?? []
  const secretaries = group.secretaries ?? group.organization?.secretaries ?? []

  const heroConvenors = roster.heroPeople(
    convenors.length ? convenors : coChairs,
    convenorTerms,
  )
  const heroConvenorLabel = convenors.length
    ? 'Convenor'
    : (coChairs.length ? 'Co-chair' : '')

  return {
    heroConvenors,
    heroConvenorLabel,
    heroManagers: roster.heroPeople(managers),
    heroSecretaries: roster.heroPeople(secretaries),
    convenorSeats: resolveConvenorSeats(group.convenor_seats, convenorTerms, roster),
    standardCards: roster.standardCardsFor(group.standards ?? []),
    projectCards: roster.projectCardsFor(group.active_projects ?? []),
  }
}
