import type { SessionStatus } from '../model/contracts'

const statusLabels: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  full: 'Full',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export function StatusLabel({ status }: { status: SessionStatus }) {
  return (
    <span className={`status-label status-${status}`}>
      <span aria-hidden="true" className="status-dot" />
      {statusLabels[status]}
    </span>
  )
}
