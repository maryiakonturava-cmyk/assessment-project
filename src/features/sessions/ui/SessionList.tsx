import type { ListState } from '../state/sessions-workspace'
import { formatSessionDate } from '../model/normalize'
import { AsyncStateMessage } from './AsyncStateMessage'
import { CapacitySummary } from './CapacitySummary'
import { StatusLabel } from './StatusLabel'

interface SessionListProps {
  state: ListState
  hasFilters: boolean
  onRetry: () => void
  onClearFilters: () => void
  onCreate: () => void
  onOpen: (sessionId: string) => void
}

function sessionTypeLabel(type: string): string {
  return type[0].toUpperCase() + type.slice(1)
}

export function SessionList({
  state,
  hasFilters,
  onRetry,
  onClearFilters,
  onCreate,
  onOpen,
}: SessionListProps) {
  if (state.status === 'loading') {
    return (
      <section className="list-surface" aria-busy="true" aria-labelledby="list-heading">
        <div className="list-header"><h2 id="list-heading">Sessions</h2></div>
        <div className="loading-rows" aria-label="Loading sessions…">
          {[1, 2, 3, 4].map((row) => <span key={row} />)}
        </div>
      </section>
    )
  }

  if (state.status === 'error' && (!state.previous || state.previous.data.length === 0)) {
    return (
      <section className="list-surface" aria-labelledby="list-heading">
        <div className="list-header"><h2 id="list-heading">Sessions</h2></div>
        <AsyncStateMessage
          tone="error"
          title="Sessions could not load."
          description={state.error.message}
          actionLabel="Try again"
          onAction={onRetry}
        />
      </section>
    )
  }

  const data = state.status === 'success' ? state.data.data : state.previous?.data ?? []
  const total = state.status === 'success' ? state.data.meta.total : state.previous?.meta.total ?? 0

  if (data.length === 0) {
    return (
      <section className="list-surface" aria-labelledby="list-heading">
        <div className="list-header"><h2 id="list-heading">Sessions</h2></div>
        <AsyncStateMessage
          title={hasFilters ? 'No sessions match these filters.' : 'No sessions yet.'}
          description={hasFilters ? 'Clear filters to see all scheduled work.' : 'Create your first session to start building the schedule.'}
          actionLabel={hasFilters ? 'Clear filters' : 'Create session'}
          onAction={hasFilters ? onClearFilters : onCreate}
        />
      </section>
    )
  }

  return (
    <section className="list-surface" aria-labelledby="list-heading" aria-busy={state.status === 'error' ? undefined : undefined}>
      <div className="list-header">
        <div>
          <h2 id="list-heading">Sessions</h2>
          <p>{total} {total === 1 ? 'session' : 'sessions'}</p>
        </div>
        {state.status === 'error' && (
          <button className="button button-secondary" type="button" onClick={onRetry}>Retry update</button>
        )}
      </div>
      {state.status === 'error' && (
        <div className="list-inline-error" role="alert">
          <span>{state.error.message}</span>
          <button className="button button-text" type="button" onClick={onRetry}>Try again</button>
        </div>
      )}
      <div className="desktop-list">
        <table>
          <caption className="visually-hidden">Training sessions</caption>
          <thead>
            <tr>
              <th scope="col">Session</th>
              <th scope="col">Start</th>
              <th scope="col">Coach</th>
              <th scope="col">Capacity</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="visually-hidden">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((session) => (
              <tr key={session.id}>
                <td>
                  <strong>{session.title}</strong>
                  <span>{sessionTypeLabel(session.type)} / {session.location.name}</span>
                </td>
                <td>
                  <strong>{formatSessionDate(session.startsAt)}</strong>
                  <span>{session.durationMinutes} minutes</span>
                </td>
                <td>{session.coach.name}</td>
                <td><CapacitySummary bookedCount={session.bookedCount} capacity={session.capacity} /></td>
                <td><StatusLabel status={session.status} /></td>
                <td><button className="button button-text" type="button" onClick={() => onOpen(session.id)}>Open details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mobile-list">
        {data.map((session) => (
          <li key={session.id}>
            <button className="mobile-session" type="button" onClick={() => onOpen(session.id)}>
              <span className="mobile-session-title"><strong>{session.title}</strong><StatusLabel status={session.status} /></span>
              <span>{sessionTypeLabel(session.type)} / {session.location.name}</span>
              <span>{formatSessionDate(session.startsAt)} · {session.durationMinutes} minutes</span>
              <span>Coach: {session.coach.name}</span>
              <CapacitySummary bookedCount={session.bookedCount} capacity={session.capacity} />
              <span className="mobile-open-label">Open details</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
