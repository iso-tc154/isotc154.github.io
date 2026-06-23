/**
 * Legacy module alias. Canonical home is now {@link './plenary'}.
 *
 * The names below are preserved verbatim so existing imports keep working;
 * new code should import from `./plenary` directly.
 */
export type {
  PlenaryStatus as EventStatus,
  PlenaryDateBound as EventDateBound,
  PlenaryTime as EventTime,
  PlenaryVenue as EventVenue,
  PlenaryContact as EventContact,
  PlenaryScheduleItem as EventScheduleItem,
  PlenaryDeadline as EventDeadline,
  PlenaryAccommodation as EventAccommodation,
  PlenaryPracticalInfo as EventPracticalInfo,
  PlenarySource as PlenaryEvent,
} from './plenary'
export type { PracticalSection, PracticalValue } from './plenary'
