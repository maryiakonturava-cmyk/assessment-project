import clock from '../../frontend-accelerator-assessment/fixtures/fixture-clock.json'

export function rebaseTimestamp(value: string, now = Date.now()): string {
  const difference = now - Date.parse(clock.referenceNow)
  return new Date(Date.parse(value) + difference).toISOString()
}

export function rebaseRecord<T extends Record<string, unknown>>(
  record: T,
  now = Date.now(),
): T {
  const timestampFields = new Set(clock.timestampFields)

  const rebaseValue = (value: unknown, key?: string): unknown => {
    if (typeof value === 'string' && key && timestampFields.has(key)) {
      return rebaseTimestamp(value, now)
    }
    if (Array.isArray(value)) {
      return value.map((item) => rebaseValue(item))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [entryKey, rebaseValue(entryValue, entryKey)]),
      )
    }
    return value
  }

  return rebaseValue(structuredClone(record)) as T
}
