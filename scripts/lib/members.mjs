import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { memberPath } from '../../src/utils/urn.ts'
import { LEADERSHIP_ROLE_IDS } from '../../src/utils/roles.ts'
import { toISODate, toNullableISODate } from './dates.mjs'

export function loadGroups(groupsDir) {
  if (!fs.existsSync(groupsDir)) {
    console.warn(`[members] groups dir not found: ${groupsDir}`)
    return {}
  }
  const groups = {}
  for (const file of fs.readdirSync(groupsDir)) {
    if (!/\.(ya?ml)$/.test(file)) continue
    const id = file.replace(/\.ya?ml$/, '')
    const fullPath = path.join(groupsDir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    groups[id] = {
      ...data,
      id: data.id || id,
      members: [],
      past_members: [],
      convenors: [],
      co_chairs: [],
      managers: [],
    }
  }
  return groups
}

export function loadMembers(membersDir, chairMemberId) {
  if (!fs.existsSync(membersDir)) {
    console.warn(`[members] dir not found: ${membersDir}`)
    return { all: {}, chair: null, current: [], past: [], leadership: [] }
  }

  const all = {}
  const current = []
  const past = []
  const leadership = []
  let chair = null

  for (const file of fs.readdirSync(membersDir)) {
    if (!/\.(ya?ml)$/.test(file)) continue
    const fullPath = path.join(membersDir, file)
    const data = yaml.load(fs.readFileSync(fullPath, 'utf8'))
    if (!data) continue
    const id = data['member-id']
    if (!id) continue

    const roleRecords = Array.isArray(data.roles) ? data.roles : []
    const byRoleId = { _all: { in: { _all: [] } } }

    const withGroup = new Set()
    const withoutGroup = new Set()
    for (const r of roleRecords) {
      if (!r || !r.id) continue
      if (r.group) withGroup.add(r.id)
      else withoutGroup.add(r.id)
    }
    const dropIds = new Set([...withGroup].filter(x => withoutGroup.has(x)))

    for (const role of roleRecords) {
      if (!role || !role.id) continue
      const groupId = role.group
      if (!groupId && dropIds.has(role.id)) continue

      byRoleId[role.id] ||= { in: { _all: [] } }
      byRoleId[role.id].in._all.push(role)
      byRoleId._all.in._all.push(role)

      if (groupId) {
        byRoleId[role.id].in[groupId] ||= []
        byRoleId[role.id].in[groupId].push(role)
        byRoleId._all.in[groupId] ||= []
        byRoleId._all.in[groupId].push(role)
      }
    }

    const allRoles = byRoleId._all.in._all
    const isCurrent = data.active === true || allRoles.some(r => r && typeof r === 'object' && r.to == null)
    const isTheChair = chairMemberId === id
    const isInLeadership = allRoles.some(
      r => r && typeof r === 'object' && LEADERSHIP_ROLE_IDS.has(r.id) && r.to == null,
    )

    const member = {
      ...data,
      url: memberPath(id),
      roles: byRoleId,
      is_current: isCurrent,
      is_the_chair: isTheChair,
      is_in_leadership: isInLeadership,
    }
    all[id] = member

    if (isCurrent) {
      if (!isTheChair && !isInLeadership) current.push(id)
      if (isInLeadership) leadership.push(id)
      if (isTheChair) chair = id
    } else {
      past.push(id)
    }
  }

  return { all, chair, current, past, leadership }
}

const CONVENOR_ROLE_IDS = new Set(['convenor', 'co_chair'])

export function attachMembersToGroups(groups, membersAll) {
  for (const group of Object.values(groups)) {
    group.convenor_terms = []
  }
  for (const member of Object.values(membersAll)) {
    const roleRecords = member.roles?._all?.in
    if (!roleRecords) continue
    for (const [groupId, records] of Object.entries(roleRecords)) {
      if (groupId === '_all') continue
      const group = groups[groupId]
      if (!group) continue
      for (const r of records) {
        const isCurrent = r.to == null
        if (isCurrent) {
          if (r.id === 'manager') group.managers.push(member['member-id'])
          else if (r.id === 'convenor') group.convenors.push(member['member-id'])
          else if (r.id === 'co_chair') group.co_chairs.push(member['member-id'])
          else if (r.id === 'member') group.members.push(member['member-id'])
        } else if (r.id === 'member') {
          group.past_members.push(member['member-id'])
        }
        if (CONVENOR_ROLE_IDS.has(r.id)) {
          const from = toISODate(r.from)
          if (!from) continue
          const to = toNullableISODate(r.to)
          group.convenor_terms.push({
            member_id: member['member-id'],
            name: member.name,
            from,
            to,
            current: isCurrent,
            role: r.id,
          })
        }
      }
    }
  }
  for (const group of Object.values(groups)) {
    group.convenor_terms.sort((a, b) => a.from.localeCompare(b.from) || a.name.localeCompare(b.name))
  }
}

export function enrichConvenorTerms(groups, eventData) {
  const appointmentByKey = new Map()
  for (const ev of eventData.events) {
    if (ev.type !== 'convenor_appointed' && ev.type !== 'convenor_extended') continue
    if (!ev.person_member_id) continue
    const key = `${ev.group_id}|${ev.person_member_id}`
    const prev = appointmentByKey.get(key)
    if (!prev || toISODate(ev.date) > toISODate(prev.date)) {
      appointmentByKey.set(key, {
        ...ev,
        date: toISODate(ev.date),
        term_until: toISODate(ev.term_until),
      })
    }
  }
  for (const [groupId, group] of Object.entries(groups)) {
    if (!group.convenor_terms) continue
    for (const term of group.convenor_terms) {
      const ev = appointmentByKey.get(`${groupId}|${term.member_id}`)
      if (!ev) continue
      if (!term.resolution_ref && ev.resolution_ref) term.resolution_ref = ev.resolution_ref
      if (ev.term_until && (!term.to || ev.term_until > term.to)) {
        term.to = ev.term_until
        term.current = false
      }
    }
  }
}

export function buildOrganizationMembers(nationalBodies, liaisons, membersAll) {
  const shortNameMap = {}
  for (const org of [...nationalBodies, ...liaisons]) {
    if (org.short_name) shortNameMap[org.short_name.toLowerCase()] = org.id
  }
  const result = {}
  for (const [memberId, member] of Object.entries(membersAll)) {
    const aff = member.affiliation
    if (!aff) continue
    const shortName = aff.split(',')[0].trim().replace(/-/g, ' ')
    const orgId = shortNameMap[shortName.toLowerCase()]
    if (orgId) {
      (result[orgId] ||= []).push(memberId)
    }
  }
  return result
}
