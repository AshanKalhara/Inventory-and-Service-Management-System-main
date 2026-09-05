export function getServiceNumberMap(
  allRecords: { id: number; serviceDate: Date | string }[]
) {
  const sorted = [...allRecords].sort((a, b) => {
    const dateDiff = new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime()
    if (dateDiff !== 0) return dateDiff
    return a.id - b.id // tiebreaker: lower id = created earlier
  })

  const map = new Map<string, number>()
  sorted.forEach((r, i) => map.set(String(r.id), i + 1))
  return map
}