import {
  attachMembersToGroups,
  enrichConvenorTerms,
} from './members.mjs'
import { attachGroupLifecycle } from './groupHistory.mjs'

// Group record build pipeline.
//
// The group records are assembled in three passes that must run in a
// specific order:
//
//   1. attachMembersToGroups   — seeds convenors, past leadership, managers,
//                                and the bare convenor_terms (from/to only).
//   2. attachGroupLifecycle    — attaches curated history.events, established,
//                                dissolved, predecessor, successor. Must run
//                                after step 1 because it relies on group
//                                records existing for every id referenced by
//                                an event.
//   3. enrichConvenorTerms     — decorates convenor_terms (produced in step 1)
//                                with resolution_ref / term_until, by joining
//                                against the lifecycle events produced in
//                                step 2. Reads group.history.events only —
//                                no re-walking of raw eventData.
//
// Encoding the order here means callers (build-data.mjs, specs, future
// scripts) get a single entry point and cannot accidentally skip or
// re-order a pass.

export function buildGroupRecords(groups, members, groupEvents) {
  attachMembersToGroups(groups, members)
  attachGroupLifecycle(groups, groupEvents)
  enrichConvenorTerms(groups)
  return groups
}
