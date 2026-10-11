import type { CreateFieldErrors } from '../model/validation'

interface FormErrorSummaryProps {
  message?: string
  fieldErrors: CreateFieldErrors
}

export function FormErrorSummary({ message, fieldErrors }: FormErrorSummaryProps) {
  const fields = Object.entries(fieldErrors).filter(([, value]) => value)
  if (!message && fields.length === 0) {
    return null
  }

  return (
    <div className="form-error-summary" role="alert" tabIndex={-1}>
      <strong>{message ?? 'Check the highlighted fields.'}</strong>
      {fields.length > 0 && (
        <ul>
          {fields.map(([field, error]) => (
            <li key={field}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
