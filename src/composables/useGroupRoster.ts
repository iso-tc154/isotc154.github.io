import { useMembers } from './useMembers'
import { useStandards } from './useStandards'
import { useProjects } from './useProjects'
import { useGroups } from './useGroups'
import {
  standardUrlFromRaw,
  standardYear,
  standardStatusLabel,
} from '../domain/standardPresentation'
import { projectStatusLabel, projectScopeExcerpt } from '../domain/projectPresentation'
import { projectPath } from '../utils/urn'
import type { Group, ConvenorTerm } from '../types/group'
import type { Standard } from '../types/standard'
import type { Project } from '../types/project'

export interface HeroPerson {
  id: string
  name: string
  fromYear?: string
}

export interface StandardCard {
  raw: string
  standard?: Standard
  url: string
  year: string
  stage: string
}

export interface ProjectCard {
  id: string
  project?: Project
  url: string
  name: string
  title?: string
  stage?: string
  statusLabel: string
  excerpt: string
}

export function useGroupRoster() {
  const { get: getMember } = useMembers()
  const { all: allStandards } = useStandards()
  const { get: getProject } = useProjects()
  const { get: getGroup } = useGroups()

  function nameOf(id: string): string {
    return getMember(id)?.name ?? id
  }

  function heroPeople(ids: string[], terms: ConvenorTerm[] = []): HeroPerson[] {
    return ids.map(id => {
      const term = terms.find(t => t.member_id === id)
      return {
        id,
        name: nameOf(id),
        fromYear: term?.from ? String(term.from).slice(0, 4) : undefined,
      }
    })
  }

  function standardCardsFor(raws: string[]): StandardCard[] {
    const standards = allStandards()
    const byName = new Map<string, Standard>()
    for (const s of standards) if (s.iso?.name) byName.set(s.iso.name, s)
    return raws.map(raw => {
      const standard = byName.get(raw)
      return {
        raw,
        standard,
        url: standardUrlFromRaw(standards, raw),
        year: standardYear(standard),
        stage: standard ? standardStatusLabel(standard.tc154?.status) : '',
      }
    })
  }

  function projectCardsFor(ids: string[]): ProjectCard[] {
    return ids.map(id => {
      const project = getProject(id)
      return {
        id,
        project,
        url: projectPath(id),
        name: project?.name ?? id,
        title: project?.title,
        stage: project?.stage,
        statusLabel: project?.status ? projectStatusLabel(project.status) : '',
        excerpt: project ? projectScopeExcerpt(project) : '',
      }
    })
  }

  function predecessorTermsOf(group: Group): ConvenorTerm[] {
    const pred = group.predecessor
    if (!pred) return []
    return getGroup(pred.id)?.convenor_terms ?? []
  }

  return { nameOf, heroPeople, standardCardsFor, projectCardsFor, predecessorTermsOf }
}
