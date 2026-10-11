interface AsyncStateMessageProps {
  tone?: 'neutral' | 'error'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function AsyncStateMessage({
  tone = 'neutral',
  title,
  description,
  actionLabel,
  onAction,
}: AsyncStateMessageProps) {
  return (
    <div className={`state-message state-message-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button className="button button-secondary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
