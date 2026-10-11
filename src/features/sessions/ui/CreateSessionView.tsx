import { useEffect, useId, useRef } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { SessionDetails } from '../model/contracts'
import { useCreateSession } from '../state/create-session'
import type { SessionsClient } from '../api/sessions-client'
import type { CreateField, CreateSessionDraft } from '../model/validation'
import { AsyncStateMessage } from './AsyncStateMessage'
import { FormErrorSummary } from './FormErrorSummary'

interface CreateSessionViewProps {
  client: SessionsClient
  onBack: () => void
  onCreated: (session: SessionDetails) => void
  onOpenCreated: (sessionId: string) => void
  onClearFiltersAndOpen: (sessionId: string) => void
  onDirtyChange: (isDirty: boolean) => void
}

function Field({
  field,
  label,
  error,
  hint,
  children,
}: {
  field: CreateField
  label: string
  error?: string
  hint?: string
  children: (id: string, describedBy?: string) => ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children(id, describedBy)}
      {hint && <span id={hintId} className="field-hint">{hint}</span>}
      {error && <span id={errorId} className="field-error">{error}</span>}
      <span className="visually-hidden">{field}</span>
    </div>
  )
}

export function CreateSessionView({
  client,
  onBack,
  onCreated,
  onOpenCreated,
  onClearFiltersAndOpen,
  onDirtyChange,
}: CreateSessionViewProps) {
  const form = useCreateSession(client, onCreated)
  const { draft, updateField, fieldErrors, formError, coachState, pending, success } = form
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    onDirtyChange(form.isDirty && !success)
  }, [form.isDirty, onDirtyChange, success])

  useEffect(() => {
    const firstInvalidField = Object.entries(fieldErrors).find(([, message]) => message)?.[0]
    const target = firstInvalidField
      ? formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
      : formError
        ? formRef.current?.querySelector<HTMLElement>('.form-error-summary')
        : null
    target?.focus()
  }, [fieldErrors, formError])

  const update = (field: keyof CreateSessionDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    updateField(field, event.target.value as never)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    form.submit()
  }

  const handleBack = () => {
    if (form.isDirty && !success && !window.confirm('Discard this session draft?')) {
      return
    }
    onBack()
  }

  return (
    <section className="create-view" aria-labelledby="create-heading">
      <div className="create-header">
        <button className="button button-text" type="button" onClick={handleBack}>← Back to sessions</button>
        <span className="eyebrow">New schedule item</span>
        <h1 id="create-heading">Create session</h1>
        <p>Schedule future training work for your programs and coaches.</p>
      </div>
      {success && (
        <div className="success-message" role="status" aria-live="polite">
          <strong>{success.title} was created.</strong>
          <div className="success-actions">
            <button className="button button-primary" type="button" onClick={() => onOpenCreated(success.id)}>Open session</button>
            <button className="button button-secondary" type="button" onClick={() => onClearFiltersAndOpen(success.id)}>Clear filters &amp; show session</button>
          </div>
        </div>
      )}
      <form ref={formRef} className="session-form" onSubmit={handleSubmit} noValidate>
        <FormErrorSummary message={formError} fieldErrors={fieldErrors} />
        <fieldset>
          <legend>Basics</legend>
          <Field field="title" label="Title" error={fieldErrors.title} hint="3–80 characters.">
            {(id, describedBy) => <input id={id} name="title" value={draft.title} onChange={update('title')} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={describedBy} autoComplete="off" />}
          </Field>
          <Field field="type" label="Session type" error={fieldErrors.type}>
            {(id, describedBy) => (
              <select id={id} name="type" value={draft.type} onChange={update('type')} aria-invalid={Boolean(fieldErrors.type)} aria-describedby={describedBy}>
                <option value="">Choose type</option><option value="training">Training</option><option value="camp">Camp</option><option value="private">Private</option>
              </select>
            )}
          </Field>
          <Field field="visibility" label="Visibility" error={fieldErrors.visibility}>
            {(id, describedBy) => (
              <select id={id} name="visibility" value={draft.visibility} onChange={update('visibility')} aria-invalid={Boolean(fieldErrors.visibility)} aria-describedby={describedBy}>
                <option value="public">Public</option><option value="invite-only">Invite only</option>
              </select>
            )}
          </Field>
        </fieldset>
        <fieldset>
          <legend>Schedule</legend>
          <Field field="date" label="Date" error={fieldErrors.date} hint="Uses your local timezone.">
            {(id, describedBy) => <input id={id} name="date" type="date" value={draft.date} onChange={update('date')} aria-invalid={Boolean(fieldErrors.date)} aria-describedby={describedBy} />}
          </Field>
          <Field field="time" label="Start time" error={fieldErrors.time}>
            {(id, describedBy) => <input id={id} name="time" type="time" value={draft.time} onChange={update('time')} aria-invalid={Boolean(fieldErrors.time)} aria-describedby={describedBy} />}
          </Field>
          <Field field="durationMinutes" label="Duration (minutes)" error={fieldErrors.durationMinutes} hint="30–240 minutes.">
            {(id, describedBy) => <input id={id} name="durationMinutes" type="number" min="30" max="240" step="1" inputMode="numeric" value={draft.durationMinutes} onChange={update('durationMinutes')} aria-invalid={Boolean(fieldErrors.durationMinutes)} aria-describedby={describedBy} />}
          </Field>
        </fieldset>
        <fieldset>
          <legend>Assignment &amp; location</legend>
          <Field field="coachId" label="Coach" error={fieldErrors.coachId}>
            {(id, describedBy) => (
              <>
                <select id={id} name="coachId" value={draft.coachId} onChange={update('coachId')} disabled={coachState.status !== 'success' || pending} aria-invalid={Boolean(fieldErrors.coachId)} aria-describedby={describedBy}>
                  <option value="">{coachState.status === 'loading' ? 'Loading coaches…' : coachState.status === 'error' ? 'Coaches unavailable' : coachState.data.length === 0 ? 'No coaches available' : 'Choose coach'}</option>
                  {coachState.status === 'success' && coachState.data.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
                </select>
                {coachState.status === 'error' && <button className="button button-text inline-action" type="button" onClick={form.reloadCoaches}>Try loading coaches again</button>}
              </>
            )}
          </Field>
          <Field field="locationName" label="Location name" error={fieldErrors.locationName} hint="2–80 characters.">
            {(id, describedBy) => <input id={id} name="locationName" value={draft.locationName} onChange={update('locationName')} aria-invalid={Boolean(fieldErrors.locationName)} aria-describedby={describedBy} autoComplete="off" />}
          </Field>
          <Field field="locationAddress" label="Location address" error={fieldErrors.locationAddress} hint="3–120 characters.">
            {(id, describedBy) => <input id={id} name="locationAddress" value={draft.locationAddress} onChange={update('locationAddress')} aria-invalid={Boolean(fieldErrors.locationAddress)} aria-describedby={describedBy} autoComplete="street-address" />}
          </Field>
          <Field field="capacity" label="Capacity" error={fieldErrors.capacity} hint="1–100 people.">
            {(id, describedBy) => <input id={id} name="capacity" type="number" min="1" max="100" step="1" inputMode="numeric" value={draft.capacity} onChange={update('capacity')} aria-invalid={Boolean(fieldErrors.capacity)} aria-describedby={describedBy} />}
          </Field>
        </fieldset>
        <fieldset>
          <legend>Notes</legend>
          <Field field="description" label="Description">
            {(id, describedBy) => <textarea id={id} name="description" rows={4} value={draft.description} onChange={update('description')} aria-describedby={describedBy} />}
          </Field>
          <Field field="trainerNotes" label="Trainer notes" error={fieldErrors.trainerNotes} hint={`${draft.trainerNotes.length}/500 characters.`}>
            {(id, describedBy) => <textarea id={id} name="trainerNotes" rows={4} maxLength={500} value={draft.trainerNotes} onChange={update('trainerNotes')} aria-invalid={Boolean(fieldErrors.trainerNotes)} aria-describedby={describedBy} />}
          </Field>
        </fieldset>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={pending || coachState.status !== 'success' || coachState.data.length === 0}>
            {pending ? 'Saving…' : 'Create session'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleBack}>Cancel</button>
        </div>
        {coachState.status === 'error' && <AsyncStateMessage tone="error" title="Coach choices could not load." description={coachState.error.message} actionLabel="Try again" onAction={form.reloadCoaches} />}
      </form>
    </section>
  )
}
