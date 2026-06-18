const ROLE_LABELS: Record<string, string> = {
  chair: 'Chair',
  co_chair: 'Co-chair',
  committee_manager: 'Committee Manager',
  convenor: 'Convenor',
  editorial_programme_manager: 'Editorial Programme Manager',
  'editorial-programme-manager': 'Editorial Programme Manager',
  manager: 'Manager',
  member: 'Member',
  observer: 'Observer',
  partner: 'Partner',
  project_leader: 'Project Leader',
  'project-leader': 'Project Leader',
  secretary: 'Secretary',
  technical_programme_manager: 'Technical Programme Manager',
  'technical-programme-manager': 'Technical Programme Manager',
}

export function roleLabel(roleId: string): string {
  if (ROLE_LABELS[roleId]) return ROLE_LABELS[roleId]
  return roleId
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
