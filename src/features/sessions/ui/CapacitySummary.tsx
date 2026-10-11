interface CapacitySummaryProps {
  bookedCount: number
  capacity: number
}

export function CapacitySummary({ bookedCount, capacity }: CapacitySummaryProps) {
  const percentage = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0

  return (
    <div className="capacity-summary">
      <span>{bookedCount} booked of {capacity} places</span>
      <span className="capacity-track" aria-hidden="true">
        <span className="capacity-fill" style={{ width: `${percentage}%` }} />
      </span>
    </div>
  )
}
