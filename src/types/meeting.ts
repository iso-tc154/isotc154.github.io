/**
 * Legacy module alias. Canonical home is now {@link './plenary'}.
 *
 * The names below are preserved verbatim so existing imports keep working;
 * new code should import from `./plenary` directly.
 */
export type {
  PlenarySessionType as MeetingType,
  PlenarySessionStatus as MeetingStatus,
  PlenarySession as MeetingSession,
  Plenary as Meeting,
  RichPlenaryData as RichMeetingData,
} from './plenary'
export type { ResolvedHost, AssociateContact, AssociateKind, ResolvedAssociate } from './plenary'
