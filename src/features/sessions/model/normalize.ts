import type {
  ApiError,
  CoachesResponse,
  SessionDetails,
  SessionSummary,
  SessionsResponse,
} from './contracts'
import { SessionsClientError } from './errors'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.includes('T') &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

function isCoach(value: unknown): value is SessionSummary['coach'] {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  )
}

function isLocation(value: unknown): value is SessionSummary['location'] {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.address === 'string'
  )
}

function isSessionSummary(value: unknown): value is SessionSummary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    ['training', 'camp', 'private'].includes(value.type as string) &&
    ['scheduled', 'full', 'cancelled', 'completed'].includes(value.status as string) &&
    isIsoTimestamp(value.startsAt) &&
    Number.isInteger(value.durationMinutes) &&
    Number.isInteger(value.capacity) &&
    Number.isInteger(value.bookedCount) &&
    ['public', 'invite-only'].includes(value.visibility as string) &&
    isCoach(value.coach) &&
    isLocation(value.location) &&
    isIsoTimestamp(value.updatedAt)
  )
}

function isCancellation(value: unknown): boolean {
  return (
    isRecord(value) &&
    (typeof value.reason === 'string' || value.reason === null) &&
    isIsoTimestamp(value.cancelledAt)
  )
}

function isSessionDetails(value: unknown): value is SessionDetails {
  if (!isSessionSummary(value)) {
    return false
  }

  const details = value as unknown as Record<string, unknown>
  return (
    (typeof details.description === 'string' || details.description === null) &&
    (typeof details.trainerNotes === 'string' || details.trainerNotes === null) &&
    isIsoTimestamp(details.createdAt) &&
    (details.cancellation === null || isCancellation(details.cancellation))
  )
}

export function parseSessionsResponse(value: unknown): SessionsResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isSessionSummary) ||
    !isRecord(value.meta) ||
    !Number.isInteger(value.meta.page) ||
    !Number.isInteger(value.meta.pageSize) ||
    !Number.isInteger(value.meta.total)
  ) {
    throw malformed('sessions list')
  }

  return value as unknown as SessionsResponse
}

export function parseSessionDetails(value: unknown): SessionDetails {
  if (!isSessionDetails(value)) {
    throw malformed('session details')
  }

  return value
}

export function parseCoachesResponse(value: unknown): CoachesResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isCoach)
  ) {
    throw malformed('coach list')
  }

  return value as unknown as CoachesResponse
}

export function parseApiError(value: unknown, status: number): SessionsClientError {
  if (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  ) {
    const apiError = value as unknown as ApiError
    return new SessionsClientError({
      kind: 'api',
      status,
      code: apiError.error.code,
      message: apiError.error.message,
      fieldErrors: apiError.error.fieldErrors,
    })
  }

  return malformed('error response', status)
}

function malformed(resource: string, status?: number): SessionsClientError {
  return new SessionsClientError({
    kind: 'malformed',
    status,
    code: 'MALFORMED_RESPONSE',
    message: `The ${resource} response was not valid.`,
  })
}

export function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
