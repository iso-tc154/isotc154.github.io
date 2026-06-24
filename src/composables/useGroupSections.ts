import { computed, ref, watch, type Ref } from 'vue'
import type { Group, SubnavSection } from '../types/group'

export interface GroupSectionsInput {
  group: Ref<Group | null>
  hasOverview: Ref<boolean>
  hasHistory: Ref<boolean>
  hasMembers: Ref<boolean>
}

// Group detail tabs: which sections exist for this group, which is active,
// and whether the page is in tabbed mode (≥3 sections) or list mode.
//
// Extracted from GroupDetailView so the section contract is testable without
// rendering. The three has* refs decouple "what content exists" (the view's
// concern — it knows whether prose/events are non-empty) from "which sections
// that maps to" (this composable's concern).
export function useGroupSections(input: GroupSectionsInput) {
  const sections = computed<SubnavSection[]>(() => {
    const g = input.group.value
    if (!g) return []
    const all: Array<SubnavSection & { enabled: boolean }> = [
      { id: 'overview', label: 'Overview', enabled: input.hasOverview.value },
      { id: 'history', label: 'History', enabled: input.hasHistory.value },
      { id: 'partners', label: 'Partners', enabled: !!g.collaborative_parties?.length },
      { id: 'standards', label: 'Standards', enabled: !!g.standards?.length },
      { id: 'projects', label: 'Projects', enabled: !!g.active_projects?.length },
      { id: 'members', label: 'Members', enabled: input.hasMembers.value },
    ]
    return all.filter(s => s.enabled).map(({ id, label }) => ({ id, label }))
  })

  const enabledSectionIds = computed(() => new Set(sections.value.map(s => s.id)))
  const tabbedMode = computed(() => sections.value.length >= 3)
  const activeTab = ref('')

  watch(sections, (secs) => {
    if (!secs.length) {
      activeTab.value = ''
      return
    }
    if (activeTab.value && secs.some((s) => s.id === activeTab.value)) return
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
    activeTab.value = (hash && secs.some((s) => s.id === hash)) ? hash : secs[0].id
  }, { immediate: true })

  function sectionEnabled(id: string): boolean {
    return enabledSectionIds.value.has(id)
  }

  function sectionVisible(id: string): boolean {
    if (!tabbedMode.value) return true
    return activeTab.value === id
  }

  return { sections, sectionEnabled, tabbedMode, activeTab, sectionVisible }
}
