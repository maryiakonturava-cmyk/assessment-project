import { useCallback, useEffect, useRef, useState } from 'react'
import type { CoachSummary, SessionDetails } from '../model/contracts'
import type { SessionsClient } from '../api/sessions-client'
import { SessionsClientError, toClientError } from '../model/errors'
import {
  initialCreateDraft,
  type CreateFieldErrors,
  type CreateSessionDraft,
  validateCreateDraft,
} from '../model/validation'

export type CoachState =
  | { status: 'loading' }
  | { status: 'success'; data: CoachSummary[] }
  | { status: 'error'; error: SessionsClientError }

function mapClientFieldErrors(errors?: Record<string, string>): CreateFieldErrors {
  const mapped: CreateFieldErrors = {}
  for (const [field, message] of Object.entries(errors ?? {})) {
    const target = field === 'startsAt' ? 'date' : field
    if (Object.prototype.hasOwnProperty.call(initialCreateDraft, target)) {
      mapped[target as keyof CreateSessionDraft] = message
    }
  }
  return mapped
}

export function useCreateSession(
  client: SessionsClient,
  onSuccess: (session: SessionDetails) => void,
) {
  const [draft, setDraft] = useState<CreateSessionDraft>(initialCreateDraft)
  const [coachState, setCoachState] = useState<CoachState>({ status: 'loading' })
  const [fieldErrors, setFieldErrors] = useState<CreateFieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>()
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<SessionDetails | undefined>()
  const coachRequestId = useRef(0)
  const coachController = useRef<AbortController | null>(null)

  const loadCoaches = useCallback(() => {
    coachController.current?.abort()
    const requestId = ++coachRequestId.current
    const controller = new AbortController()
    coachController.current = controller
    setCoachState({ status: 'loading' })
    void client.listCoaches({ signal: controller.signal })
      .then((response) => {
        if (requestId === coachRequestId.current) {
          setCoachState({ status: 'success', data: response.data })
        }
      })
      .catch((error: unknown) => {
        if (requestId !== coachRequestId.current) {
          return
        }
        const clientError = toClientError(error)
        if (clientError.kind !== 'aborted') {
          setCoachState({ status: 'error', error: clientError })
        }
      })
    return () => {
      controller.abort()
      if (requestId === coachRequestId.current) {
        coachController.current = null
      }
    }
  }, [client])

  useEffect(() => loadCoaches(), [loadCoaches])

  const updateField = useCallback(<K extends keyof CreateSessionDraft>(
    field: K,
    value: CreateSessionDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(undefined)
    setSuccess(undefined)
  }, [])

  const submit = useCallback(() => {
    if (pending) {
      return
    }

    const result = validateCreateDraft(draft)
    setFieldErrors(result.fieldErrors)
    setFormError(result.formError)
    setSuccess(undefined)
    if (!result.request) {
      return
    }

    setPending(true)
    void client.createSession(result.request)
      .then((created) => {
        setSuccess(created)
        setFormError(undefined)
        onSuccess(created)
      })
      .catch((error: unknown) => {
        const clientError = toClientError(error)
        if (clientError.kind !== 'aborted') {
          setFieldErrors(mapClientFieldErrors(clientError.fieldErrors))
          setFormError(clientError.message)
        }
      })
      .finally(() => setPending(false))
  }, [client, draft, onSuccess, pending])

  return {
    draft,
    updateField,
    coachState,
    fieldErrors,
    formError,
    pending,
    success,
    submit,
    reloadCoaches: loadCoaches,
    isDirty: (Object.keys(initialCreateDraft) as Array<keyof CreateSessionDraft>)
      .some((field) => draft[field] !== initialCreateDraft[field]),
  }
}
