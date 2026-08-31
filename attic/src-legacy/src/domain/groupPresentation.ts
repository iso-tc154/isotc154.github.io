import type { Group, LifecycleStatus } from '../types/group'

// Display-side helpers for the Group domain. These answer "how should we
// describe this group to a user?" — pure logic with no type declarations,
// kept out of src/types/group.ts so that file remains a shape contract.

export function groupCategoryLabel(category: string): string {
  switch (category) {
    case 'working': return 'Working Group'
    case 'advisory': return 'Advisory Group'
    case 'cag': return "Chairman's Advisory Group"
    case 'joint': return 'Joint Working Group'
    case 'ahwg': return 'Ad Hoc Working Group'
    case 'sg': return 'Study Group'
    case 'rtc': return 'Resolution Drafting Group'
    default: return category.charAt(0).toUpperCase() + category.slice(1)
  }
}

export function lifecycleStatus(group: Group): LifecycleStatus {
  if (group.history?.dissolved) return 'dissolved'
  if (group.inactive) return 'inactive'
  return 'active'
}

export const LIFECYCLE_STATUS_PRESENTATION: Record<LifecycleStatus, { label: string }> = {
  active: { label: 'Active' },
  inactive: { label: 'Inactive' },
  dissolved: { label: 'Dissolved' },
}

export function lifecycleStatusLabel(s: LifecycleStatus): string {
  return LIFECYCLE_STATUS_PRESENTATION[s].label
}

export function establishedYear(group: Group): string | null {
  const d = group.history?.established?.date
  return d ? String(d).slice(0, 4) : null
}

export function dissolvedYear(group: Group): string | null {
  const d = group.history?.dissolved?.date
  return d ? String(d).slice(0, 4) : null
}
