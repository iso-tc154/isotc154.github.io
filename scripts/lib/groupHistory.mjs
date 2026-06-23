import fs from 'node:fs'
import yaml from 'js-yaml'
import { toISODate } from './dates.mjs'

const STATE_TYPES = new Set(['established', 'dissolved'])

function eventDate(e) {
  return toISODate(e?.date)
}

function sortByDate(events) {
  return events.slice().sort((a, b) => eventDate(a).localeCompare(eventDate(b)))
}

function normalizeEvent(e) {
  return {
    type: e.type,
    date: toISODate(e.date),
    precision: e.precision,
    title: e.title || '',
    description: e.description,
    resolution_ref: e.resolution_ref,
    resolution_meeting: e.resolution_meeting,
    person_name: e.person_name,
    person_member_id: e.person_member_id,
    term_until: toISODate(e.term_until),
    predecessor: e.predecessor,
    successor: e.successor,
  }
}

export function loadGroupEvents(filePath) {
  if (!fs.existsSync(filePath)) {
    return { events: [], overrides: [] }
  }
  const data = yaml.load(fs.readFileSync(filePath, 'utf8')) || {}
  return {
    events: Array.isArray(data.events) ? data.events : [],
    overrides: Array.isArray(data.overrides) ? data.overrides : [],
  }
}

function buildLineageLink(linkedId, event, groupsById) {
  const linked = groupsById[linkedId]
  return {
    id: linkedId,
    name: linked?.name || linkedId.toUpperCase(),
    date: eventDate(event),
    resolution_ref: event.resolution_ref,
  }
}

function deriveEstablished(groupEvents, group) {
  const stateEvents = groupEvents.filter((e) => STATE_TYPES.has(e.type))
  if (stateEvents.length === 0) return null
  const last = stateEvents[stateEvents.length - 1]
  if (last.type !== 'established') return null
  return {
    date: eventDate(last),
    precision: last.precision,
    resolution_ref: last.resolution_ref,
    resolution_meeting: last.resolution_meeting,
    predecessor: last.predecessor,
  }
}

function deriveDissolved(groupEvents, group) {
  const stateEvents = groupEvents.filter((e) => STATE_TYPES.has(e.type))
  if (stateEvents.length === 0) return null
  const last = stateEvents[stateEvents.length - 1]
  if (last.type !== 'dissolved') return null
  if (!group?.inactive) return null
  return {
    date: eventDate(last),
    precision: last.precision,
    resolution_ref: last.resolution_ref,
    resolution_meeting: last.resolution_meeting,
    successor: last.successor,
  }
}

function derivePredecessor(groupEvents, groupsById) {
  const established = groupEvents.find((e) => e.type === 'established' && e.predecessor)
  if (!established) return null
  return buildLineageLink(established.predecessor, established, groupsById)
}

function deriveSuccessor(groupEvents, groupsById) {
  const dissolved = [...groupEvents].reverse().find((e) => e.type === 'dissolved' && e.successor)
  if (!dissolved) return null
  return buildLineageLink(dissolved.successor, dissolved, groupsById)
}

function applyEstablishedOverride(events, established, overrides) {
  if (established) return events
  const ov = overrides.find((o) => o.field === 'established')
  if (!ov) return events
  return events.concat([{
    type: 'established',
    date: toISODate(ov.date),
    precision: ov.precision,
    title: ov.title || 'Established',
    description: ov.description,
  }])
}

export function deriveGroupLifecycle(groupId, eventData, groupsById) {
  const group = groupsById[groupId]
  const groupEvents = sortByDate(
    eventData.events.filter((e) => e.group_id === groupId).map(normalizeEvent),
  )
  const groupOverrides = eventData.overrides.filter((o) => o.group_id === groupId)

  const establishedFromEvents = deriveEstablished(groupEvents, group)
  const eventsWithOverrides = applyEstablishedOverride(groupEvents, establishedFromEvents, groupOverrides)
  const overrideEstablished = groupOverrides.find((o) => o.field === 'established')

  return {
    events: sortByDate(eventsWithOverrides),
    established: establishedFromEvents || (overrideEstablished
      ? { date: toISODate(overrideEstablished.date), precision: overrideEstablished.precision }
      : null),
    dissolved: deriveDissolved(groupEvents, group),
    predecessor: derivePredecessor(groupEvents, groupsById),
    successor: deriveSuccessor(groupEvents, groupsById),
  }
}

export function attachGroupLifecycle(groups, eventData) {
  const groupIds = Object.keys(groups)
  const referenced = new Set(eventData.events.map((e) => e.group_id))
  for (const id of referenced) {
    if (!groups[id]) {
      console.warn(`[groupHistory] events reference unknown group '${id}' — create _data/groups/${id}.yml or remove the event`)
    }
  }
  for (const groupId of groupIds) {
    const lifecycle = deriveGroupLifecycle(groupId, eventData, groups)
    const group = groups[groupId]
    const legacyHistory = group.history || {}
    group.history = {
      ...legacyHistory,
      events: lifecycle.events,
      established: lifecycle.established || legacyHistory.established || null,
      dissolved: lifecycle.dissolved || legacyHistory.dissolved || null,
    }
    if (lifecycle.predecessor) group.predecessor = lifecycle.predecessor
    if (lifecycle.successor) group.successor = lifecycle.successor
  }
}

