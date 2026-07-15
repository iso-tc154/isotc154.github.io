import { describe, it, expect } from 'vitest'
import type { Project } from '../types/project'
import { projectStatusLabel, projectScopeExcerpt } from './projectPresentation'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'iso-34000',
    name: 'ISO/WD 34000',
    title: 'Concepts',
    status: 'current',
    stage: 'WD',
    ...overrides,
  }
}

describe('projectStatusLabel', () => {
  it('labels current', () => {
    expect(projectStatusLabel('current')).toBe('Current')
  })

  it('labels new — case the view had been missing', () => {
    expect(projectStatusLabel('new')).toBe('New')
  })

  it('labels under-development — case the view had been missing', () => {
    expect(projectStatusLabel('under-development')).toBe('Under development')
  })

  it('labels under_development (snake)', () => {
    expect(projectStatusLabel('under_development')).toBe('Under development')
  })

  it('labels withdrawn', () => {
    expect(projectStatusLabel('withdrawn')).toBe('Withdrawn')
  })

  it('labels deleted', () => {
    expect(projectStatusLabel('deleted')).toBe('Deleted')
  })

  it('is case-insensitive', () => {
    expect(projectStatusLabel('CURRENT')).toBe('Current')
  })

  it('title-cases unknown status', () => {
    expect(projectStatusLabel('pending')).toBe('Pending')
  })

  it('returns empty string for undefined', () => {
    expect(projectStatusLabel(undefined)).toBe('')
  })
})

describe('projectScopeExcerpt', () => {
  it('returns empty string when scope missing', () => {
    expect(projectScopeExcerpt(makeProject())).toBe('')
  })

  it('returns first paragraph as-is when short', () => {
    const p = makeProject({ scope: 'First paragraph here.\n\nSecond paragraph here.' })
    expect(projectScopeExcerpt(p)).toBe('First paragraph here.')
  })

  it('strips AsciiDoc section headings', () => {
    const p = makeProject({ scope: '== Scope\n\nActual content.' })
    expect(projectScopeExcerpt(p)).toBe('Actual content.')
  })

  it('strips bold markers', () => {
    const p = makeProject({ scope: 'This has **bold** text.' })
    expect(projectScopeExcerpt(p)).toBe('This has bold text.')
  })

  it('truncates with ellipsis at 280 chars', () => {
    const long = 'x'.repeat(400)
    const p = makeProject({ scope: long })
    const result = projectScopeExcerpt(p)
    expect(result.length).toBe(281)
    expect(result.endsWith('…')).toBe(true)
  })
})
