import type { SessionStatus } from '../model/contracts'
import { sessionStatuses } from '../model/contracts'

interface SessionFiltersProps {
  query: string
  status: SessionStatus | ''
  busy: boolean
  onQueryChange: (value: string) => void
  onStatusChange: (value: SessionStatus | '') => void
  onClear: () => void
}

export function SessionFilters({
  query,
  status,
  busy,
  onQueryChange,
  onStatusChange,
  onClear,
}: SessionFiltersProps) {
  const hasFilters = Boolean(query || status)

  return (
    <section className="filter-surface" aria-labelledby="filter-heading">
      <h2 id="filter-heading" className="visually-hidden">Find sessions</h2>
      <label className="filter-search">
        <span>Search title, coach, or location</span>
        <input
          type="search"
          name="session-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search sessions…"
          aria-describedby="filter-status"
        />
      </label>
      <label>
        <span>Status</span>
        <select
          name="session-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as SessionStatus | '')}
        >
          <option value="">All statuses</option>
          {sessionStatuses.map((option) => (
            <option key={option} value={option}>
              {option[0].toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </label>
      {hasFilters && (
        <button className="button button-text" type="button" onClick={onClear}>
          Clear filters
        </button>
      )}
      <span id="filter-status" className="filter-status" aria-live="polite">
        {busy ? 'Updating results…' : ''}
      </span>
    </section>
  )
}
