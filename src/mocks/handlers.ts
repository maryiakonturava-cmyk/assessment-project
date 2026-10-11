import { http, HttpResponse } from 'msw'
import type { CreateSessionRequest, SessionStatus } from '../features/sessions/model/contracts'
import { sessionStatuses } from '../features/sessions/model/contracts'
import { getMockScenario } from './scenario-config'
import { coachChoices, sessionStore } from './session-store'

function errorResponse(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    { status },
  )
}

function isCreateRequest(value: unknown): value is CreateSessionRequest {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const body = value as Record<string, unknown>
  return (
    typeof body.title === 'string' &&
    ['training', 'camp', 'private'].includes(body.type as string) &&
    typeof body.startsAt === 'string' &&
    Number.isInteger(body.durationMinutes) &&
    typeof body.coachId === 'string' &&
    typeof body.locationName === 'string' &&
    typeof body.locationAddress === 'string' &&
    Number.isInteger(body.capacity) &&
    ['public', 'invite-only'].includes(body.visibility as string) &&
    (body.description === undefined || body.description === null || typeof body.description === 'string') &&
    (body.trainerNotes === undefined || body.trainerNotes === null || typeof body.trainerNotes === 'string')
  )
}

function filterStatus(value: string | null): SessionStatus | undefined {
  if (!value) {
    return undefined
  }
  return sessionStatuses.includes(value as SessionStatus) ? (value as SessionStatus) : undefined
}

function listHandler(request: Request) {
  const scenario = getMockScenario()
  if (scenario === 'list-error') {
    return errorResponse(500, 'SESSIONS_UNAVAILABLE', 'Sessions cannot be loaded right now.')
  }
  if (scenario === 'empty') {
    return HttpResponse.json({ data: [], meta: { page: 1, pageSize: 10, total: 0 } })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim().toLocaleLowerCase() ?? ''
  const rawStatus = url.searchParams.get('status')
  const status = filterStatus(rawStatus)
  if (rawStatus && !status) {
    return errorResponse(400, 'INVALID_FILTER', 'The selected status is not valid.')
  }

  const data = sessionStore.list().filter((session) => {
    const matchesQuery = !query || [session.title, session.coach.name, session.location.name]
      .some((value) => value.toLocaleLowerCase().includes(query))
    const matchesStatus = !status || session.status === status
    return matchesQuery && matchesStatus
  })

  return HttpResponse.json({ data, meta: { page: 1, pageSize: 10, total: data.length } })
}

export const handlers = [
  http.get('*/api/sessions', ({ request }) => listHandler(request)),
  http.get('*/api/sessions/:sessionId', ({ params }) => {
    const scenario = getMockScenario()
    if (scenario === 'details-error' && params.sessionId === 'ses_101') {
      return errorResponse(500, 'SESSION_DETAILS_UNAVAILABLE', 'Session details cannot be loaded right now.')
    }

    const details = sessionStore.get(String(params.sessionId))
    if (!details) {
      return errorResponse(404, 'SESSION_NOT_FOUND', 'The requested session no longer exists.')
    }
    return HttpResponse.json(details)
  }),
  http.get('*/api/coaches', () => {
    if (getMockScenario() === 'coaches-error') {
      return errorResponse(500, 'COACHES_UNAVAILABLE', 'Coach choices cannot be loaded right now.')
    }
    return HttpResponse.json({ data: coachChoices })
  }),
  http.post('*/api/sessions', async ({ request }) => {
    const scenario = getMockScenario()
    if (scenario === 'create-error') {
      return errorResponse(500, 'CREATE_SESSION_FAILED', 'The session could not be created.')
    }
    if (scenario === 'create-conflict') {
      return errorResponse(409, 'COACH_SCHEDULE_CONFLICT', 'The selected coach already has an overlapping session.')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse(400, 'VALIDATION_FAILED', 'Request body is not valid JSON.')
    }

    if (!isCreateRequest(body)) {
      return errorResponse(400, 'VALIDATION_FAILED', 'Check the submitted fields.')
    }

    const input = body as CreateSessionRequest
    const fieldErrors: Record<string, string> = {}
    if (input.title.trim().length < 3 || input.title.trim().length > 80) {
      fieldErrors.title = 'Title must be 3–80 characters.'
    }
    if (Number.isNaN(Date.parse(input.startsAt)) || new Date(input.startsAt) <= new Date()) {
      fieldErrors.startsAt = 'Start must be a valid future time.'
    }
    if (input.durationMinutes < 30 || input.durationMinutes > 240) {
      fieldErrors.durationMinutes = 'Duration must be between 30 and 240 minutes.'
    }
    if (input.capacity < 1 || input.capacity > 100) {
      fieldErrors.capacity = 'Capacity must be between 1 and 100.'
    }
    if (!coachChoices.some((coach) => coach.id === input.coachId)) {
      fieldErrors.coachId = 'Choose a valid coach.'
    }
    if (input.locationName.trim().length < 2 || input.locationName.trim().length > 80) {
      fieldErrors.locationName = 'Location name must be 2–80 characters.'
    }
    if (input.locationAddress.trim().length < 3 || input.locationAddress.trim().length > 120) {
      fieldErrors.locationAddress = 'Location address must be 3–120 characters.'
    }
    if (input.trainerNotes && input.trainerNotes.length > 500) {
      fieldErrors.trainerNotes = 'Trainer notes must be 500 characters or fewer.'
    }

    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(400, 'VALIDATION_FAILED', 'Check the submitted fields.', fieldErrors)
    }

    return HttpResponse.json(sessionStore.create(input), { status: 201 })
  }),
]
