interface ScheduleItem { date?: string }

export function groupScheduleByDate<S extends ScheduleItem>(schedule: S[] | undefined) {
  if (!schedule) return []
  const map = new Map<string, S[]>()
  for (const item of schedule) {
    if (!item.date) continue
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date)!.push(item)
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
}
