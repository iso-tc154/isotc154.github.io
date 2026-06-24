import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useGroupSections } from './useGroupSections'
import type { Group } from '../types/group'

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

describe('useGroupSections', () => {
  it('returns no sections when group is null', () => {
    const { sections } = useGroupSections({
      group: ref(null),
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(sections.value).toEqual([])
  })

  it('includes standards section when group has standards', () => {
    const group = ref(makeGroup({ standards: ['ISO 9735'] }))
    const { sectionEnabled } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(sectionEnabled('standards')).toBe(true)
    expect(sectionEnabled('overview')).toBe(false)
  })

  it('enters tabbed mode when three or more sections are enabled', () => {
    const group = ref(makeGroup({
      standards: ['ISO 9735'],
      collaborative_parties: [{ entity_name: 'UNECE' }],
      active_projects: ['p1'],
    }))
    const { tabbedMode, sections } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(sections.value.length).toBeGreaterThanOrEqual(3)
    expect(tabbedMode.value).toBe(true)
  })

  it('does not enter tabbed mode when fewer than three sections', () => {
    const group = ref(makeGroup({ standards: ['ISO 9735'] }))
    const { tabbedMode } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(tabbedMode.value).toBe(false)
  })

  it('reveals all sections when not in tabbed mode', () => {
    const group = ref(makeGroup({ standards: ['ISO 9735'] }))
    const { sectionVisible, tabbedMode } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(tabbedMode.value).toBe(false)
    expect(sectionVisible('standards')).toBe(true)
  })

  it('in tabbed mode, only the active tab section is visible', async () => {
    const group = ref(makeGroup({
      standards: ['ISO 9735'],
      collaborative_parties: [{ entity_name: 'UNECE' }],
      active_projects: ['p1'],
    }))
    const { sectionVisible, activeTab, tabbedMode } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    expect(tabbedMode.value).toBe(true)
    await nextTick()
    const firstTab = activeTab.value
    expect(sectionVisible(firstTab)).toBe(true)
    expect(sectionVisible(firstTab === 'standards' ? 'partners' : 'standards')).toBe(false)
  })

  it('resets activeTab when sections becomes empty', async () => {
    const group = ref<Group | null>(makeGroup({ standards: ['ISO 9735'] }))
    const { activeTab } = useGroupSections({
      group,
      hasOverview: ref(false),
      hasHistory: ref(false),
      hasMembers: ref(false),
    })
    await nextTick()
    expect(activeTab.value).not.toBe('')
    group.value = null
    await nextTick()
    expect(activeTab.value).toBe('')
  })
})
