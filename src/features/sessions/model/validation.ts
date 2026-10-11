import type {
  CreateSessionRequest,
  SessionType,
  Visibility,
} from './contracts'
import { sessionTypes, visibilities } from './contracts'

export interface CreateSessionDraft {
  title: string
  type: SessionType | ''
  date: string
  time: string
  durationMinutes: string
  coachId: string
  locationName: string
  locationAddress: string
  capacity: string
  visibility: Visibility | ''
  description: string
  trainerNotes: string
}

export type CreateField = keyof CreateSessionDraft
export type CreateFieldErrors = Partial<Record<CreateField, string>>

export interface CreateValidationResult {
  fieldErrors: CreateFieldErrors
  formError?: string
  request?: CreateSessionRequest
}

export const initialCreateDraft: CreateSessionDraft = {
  title: '',
  type: '',
  date: '',
  time: '',
  durationMinutes: '60',
  coachId: '',
  locationName: '',
  locationAddress: '',
  capacity: '20',
  visibility: 'public',
  description: '',
  trainerNotes: '',
}

function addError(errors: CreateFieldErrors, field: CreateField, message: string): void {
  if (!errors[field]) {
    errors[field] = message
  }
}

function parseInteger(value: string): number | undefined {
  if (!/^-?\d+$/.test(value.trim())) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

export function validateCreateDraft(
  draft: CreateSessionDraft,
  now = new Date(),
): CreateValidationResult {
  const fieldErrors: CreateFieldErrors = {}
  const title = draft.title.trim()
  const locationName = draft.locationName.trim()
  const locationAddress = draft.locationAddress.trim()
  const trainerNotes = draft.trainerNotes.trim()

  if (title.length < 3 || title.length > 80) {
    addError(fieldErrors, 'title', 'Title must be 3–80 characters.')
  }
  if (!sessionTypes.includes(draft.type as SessionType)) {
    addError(fieldErrors, 'type', 'Choose a session type.')
  }
  if (!draft.date) {
    addError(fieldErrors, 'date', 'Choose a date.')
  }
  if (!draft.time) {
    addError(fieldErrors, 'time', 'Choose a start time.')
  }
  if (!draft.coachId) {
    addError(fieldErrors, 'coachId', 'Choose a coach.')
  }
  if (locationName.length < 2 || locationName.length > 80) {
    addError(fieldErrors, 'locationName', 'Location name must be 2–80 characters.')
  }
  if (locationAddress.length < 3 || locationAddress.length > 120) {
    addError(fieldErrors, 'locationAddress', 'Location address must be 3–120 characters.')
  }
  if (trainerNotes.length > 500) {
    addError(fieldErrors, 'trainerNotes', 'Trainer notes must be 500 characters or fewer.')
  }
  if (!visibilities.includes(draft.visibility as Visibility)) {
    addError(fieldErrors, 'visibility', 'Choose who can see this session.')
  }

  const durationMinutes = parseInteger(draft.durationMinutes)
  if (durationMinutes === undefined || durationMinutes < 30 || durationMinutes > 240) {
    addError(fieldErrors, 'durationMinutes', 'Duration must be an integer from 30 to 240 minutes.')
  }

  const capacity = parseInteger(draft.capacity)
  if (capacity === undefined || capacity < 1 || capacity > 100) {
    addError(fieldErrors, 'capacity', 'Capacity must be an integer from 1 to 100.')
  }

  let startsAt: string | undefined
  if (draft.date && draft.time) {
    const localDate = new Date(`${draft.date}T${draft.time}:00`)
    if (Number.isNaN(localDate.getTime())) {
      addError(fieldErrors, 'date', 'Enter a valid future date and time.')
      addError(fieldErrors, 'time', 'Enter a valid future date and time.')
    } else if (localDate <= now) {
      addError(fieldErrors, 'date', 'Start must be in the future.')
      addError(fieldErrors, 'time', 'Start must be in the future.')
    } else {
      startsAt = localDate.toISOString()
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !startsAt || durationMinutes === undefined || capacity === undefined) {
    return {
      fieldErrors,
      formError: 'Check the highlighted fields before creating the session.',
    }
  }

  return {
    fieldErrors,
    request: {
      title,
      type: draft.type as SessionType,
      startsAt,
      durationMinutes,
      coachId: draft.coachId,
      locationName,
      locationAddress,
      capacity,
      visibility: draft.visibility as Visibility,
      description: draft.description.trim() || null,
      trainerNotes: trainerNotes || null,
    },
  }
}
