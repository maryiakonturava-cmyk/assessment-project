import { useEffect, useRef } from 'react'
import type { DetailsState } from '../state/sessions-workspace'
import { formatSessionDate } from '../model/normalize'
import { AsyncStateMessage } from './AsyncStateMessage'
import { CapacitySummary } from './CapacitySummary'
import { StatusLabel } from './StatusLabel'

interface SessionDetailsSurfaceProps {
  state: DetailsState
  onClose: () => void
  onRetry: () => void
}

export function SessionDetailsSurface({ state, onClose, onRetry }: SessionDetailsSurfaceProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const surfaceRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (state.status === 'idle') {
      return
    }

    previousFocus.current = document.activeElement as HTMLElement
    headingRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') {
        return
      }

      const focusable = surfaceRef.current?.querySelectorAll<HTMLElement>(
        'h2[tabindex="-1"], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('surface-open')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('surface-open')
      previousFocus.current?.focus()
    }
  }, [onClose, state.status])

  if (state.status === 'idle') {
    return null
  }

  const session = state.status === 'success' ? state.session : undefined
  const title = session?.title ?? 'Session details'
  const sessionType = session?.type ? session.type[0].toUpperCase() + session.type.slice(1) : undefined

  return (
    <div className="surface-backdrop">
      <aside ref={surfaceRef} className="details-surface" role="dialog" aria-modal="true" aria-labelledby="details-heading">
        <div className="surface-topbar">
          <span className="eyebrow">Session details</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close session details">×</button>
        </div>
        <div className="details-content">
          <h2 id="details-heading" tabIndex={-1} ref={headingRef}>{title}</h2>
          {state.status === 'loading' && (
            <div className="details-loading" aria-busy="true">Loading details…</div>
          )}
          {state.status === 'error' && (
            <AsyncStateMessage
              tone="error"
              title={state.error.code === 'SESSION_NOT_FOUND' ? 'This session is no longer available.' : 'Details could not load.'}
              description={state.error.message}
              actionLabel={state.error.code === 'SESSION_NOT_FOUND' ? 'Back to sessions' : 'Try again'}
              onAction={state.error.code === 'SESSION_NOT_FOUND' ? onClose : onRetry}
            />
          )}
          {session && (
            <>
              <StatusLabel status={session.status} />
              <dl className="details-list">
                <div><dt>Type</dt><dd>{sessionType}</dd></div>
                <div><dt>Start</dt><dd>{formatSessionDate(session.startsAt)}</dd></div>
                <div><dt>Duration</dt><dd>{session.durationMinutes} minutes</dd></div>
                <div><dt>Coach</dt><dd>{session.coach.name}<br /><a href={`mailto:${session.coach.email}`}>{session.coach.email}</a></dd></div>
                <div><dt>Location</dt><dd>{session.location.name}<br />{session.location.address}</dd></div>
                <div><dt>Capacity</dt><dd><CapacitySummary bookedCount={session.bookedCount} capacity={session.capacity} /></dd></div>
                <div><dt>Visibility</dt><dd>{session.visibility === 'invite-only' ? 'Invite only' : 'Public'}</dd></div>
              </dl>
              <section className="details-section" aria-labelledby="description-heading">
                <h3 id="description-heading">Description</h3>
                <p>{session.description || 'No description provided.'}</p>
              </section>
              <section className="details-section" aria-labelledby="notes-heading">
                <h3 id="notes-heading">Trainer notes</h3>
                <p>{session.trainerNotes || 'No trainer notes provided.'}</p>
              </section>
              <dl className="details-meta">
                <div><dt>Created</dt><dd>{formatSessionDate(session.createdAt)}</dd></div>
                <div><dt>Last updated</dt><dd>{formatSessionDate(session.updatedAt)}</dd></div>
              </dl>
            </>
          )}
        </div>
        <div className="surface-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>Back to sessions</button>
        </div>
      </aside>
    </div>
  )
}
