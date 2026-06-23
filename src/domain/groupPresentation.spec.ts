import { describe, it, expect } from 'vitest'
import type { Group } from '../types/group'
import { groupCategoryLabel, lifecycleStatus } from './groupPresentation'

// Real model instances — no doubles. Plain objects typed as Group.

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g',
    name: 'G',
    title: 'Group',
    category: 'working',
    order: 1,
    ...overrides,
  }
}

describe('groupCategoryLabel', () => {
  it('labels working groups', () => {
    expect(groupCategoryLabel('working')).toBe('Working Group')
  })

  it('labels advisory groups', () => {
    expect(groupCategoryLabel('advisory')).toBe('Advisory Group')
  })

  it('labels the CAG', () => {
    expect(groupCategoryLabel('cag')).toBe("Chairman's Advisory Group")
  })

  it('labels joint working groups', () => {
    expect(groupCategoryLabel('joint')).toBe('Joint Working Group')
  })

  it('labels ad-hoc working groups', () => {
    expect(groupCategoryLabel('ahwg')).toBe('Ad Hoc Working Group')
  })

  it('labels study groups', () => {
    expect(groupCategoryLabel('sg')).toBe('Study Group')
  })

  it('labels resolution drafting groups', () => {
    expect(groupCategoryLabel('rtc')).toBe('Resolution Drafting Group')
  })

  it('title-cases unknown categories', () => {
    expect(groupCategoryLabel('committee')).toBe('Committee')
  })
})

describe('lifecycleStatus', () => {
  it('returns "active" by default', () => {
    expect(lifecycleStatus(makeGroup())).toBe('active')
  })

  it('returns "dissolved" when history.dissolved is set', () => {
    const group = makeGroup({
      inactive: true,
      history: {
        dissolved: {
          date: '2022-10-14',
        },
      },
    })
    expect(lifecycleStatus(group)).toBe('dissolved')
  })

  it('returns "dissolved" even when inactive is also set (dissolved wins)', () => {
    const group = makeGroup({
      inactive: true,
      history: { dissolved: { date: '2022-10-14' } },
    })
    expect(lifecycleStatus(group)).toBe('dissolved')
  })

  it('returns "inactive" when group.inactive is true and no dissolved summary', () => {
    const group = makeGroup({ inactive: true })
    expect(lifecycleStatus(group)).toBe('inactive')
  })

  it('returns "active" for a group with a past dissolved event but no current dissolved summary (CAG case)', () => {
    const group = makeGroup({
      history: {
        events: [
          { type: 'dissolved', date: '2011-09-14', title: 'Dissolved' },
          { type: 'convenor_appointed', date: '2024-10-25', title: 'Convenor appointed' },
        ],
      },
    })
    expect(lifecycleStatus(group)).toBe('active')
  })
})
