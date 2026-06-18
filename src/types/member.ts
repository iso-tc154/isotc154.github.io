export interface RoleDate {
  date?: string
  precision?: 'day' | 'month' | 'year'
}

export interface RoleRecord {
  id: string
  group?: string
  from?: RoleDate
  to?: RoleDate
}

type RoleGroupMap = Record<string, RoleRecord[]>

export interface MemberRolesIndex {
  _all: { in: RoleGroupMap }
  [roleId: string]: { in: RoleGroupMap }
}

export interface MemberLink {
  url: string
  title?: string
  label?: string
}

export interface Member {
  'member-id': string
  name: string
  picture?: string
  active: boolean
  affiliation?: string
  bio?: string
  roles: MemberRolesIndex
  deceased?: boolean
  links?: MemberLink[]
  url?: string
  is_current?: boolean
  is_the_chair?: boolean
  is_in_leadership?: boolean
}

export interface MembersIndex {
  all: Record<string, Member>
  chair: string | null
  current: string[]
  past: string[]
  leadership: string[]
}

export function flattenMemberRoles(member: Member): RoleRecord[] {
  return member.roles?._all?.in?._all ?? []
}

export function memberRoleSpan(role: RoleRecord): string {
  const fmt = (d?: RoleDate): string => {
    if (!d?.date) return ''
    const dt = new Date(d.date)
    if (isNaN(dt.getTime())) return ''
    if (d.precision === 'year') return String(dt.getUTCFullYear())
    if (d.precision === 'month') return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  const start = fmt(role.from)
  const end = fmt(role.to) || 'present'
  return start ? `${start} – ${end}` : end
}
