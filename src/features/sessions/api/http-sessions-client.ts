import type {
  CoachesResponse,
  CreateSessionRequest,
  SessionDetails,
  SessionStatus,
  SessionsResponse,
} from '../model/contracts'
import {
  SessionsClientError,
  toClientError,
} from '../model/errors'
import {
  parseApiError,
  parseCoachesResponse,
  parseSessionDetails,
  parseSessionsResponse,
} from '../model/normalize'
import type { SessionsClient, RequestOptions } from './sessions-client'

async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  parse: (value: unknown) => T,
): Promise<T> {
  try {
    const response = await fetch(input, init)
    let body: unknown

    try {
      body = await response.json()
    } catch (error) {
      throw new SessionsClientError({
        kind: 'malformed',
        status: response.status,
        code: 'MALFORMED_RESPONSE',
        message: 'The service returned an unreadable response.',
        cause: error,
      })
    }

    if (!response.ok) {
      throw parseApiError(body, response.status)
    }

    return parse(body)
  } catch (error) {
    throw toClientError(error)
  }
}

function requestInit(options?: RequestOptions): RequestInit {
  return {
    signal: options?.signal,
    headers: {
      Accept: 'application/json',
    },
  }
}

export class HttpSessionsClient implements SessionsClient {
  async listSessions(input: {
    query?: string
    status?: SessionStatus
    signal?: AbortSignal
  }): Promise<SessionsResponse> {
    const params = new URLSearchParams()
    const query = input.query?.trim()
    if (query) {
      params.set('query', query)
    }
    if (input.status) {
      params.set('status', input.status)
    }

    const suffix = params.toString()
    const url = suffix ? `/api/sessions?${suffix}` : '/api/sessions'
    return request(url, requestInit({ signal: input.signal }), parseSessionsResponse)
  }

  async getSession(sessionId: string, options?: RequestOptions): Promise<SessionDetails> {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
      requestInit(options),
      parseSessionDetails,
    )
  }

  async listCoaches(options?: RequestOptions): Promise<CoachesResponse> {
    return request('/api/coaches', requestInit(options), parseCoachesResponse)
  }

  async createSession(
    input: CreateSessionRequest,
    options?: RequestOptions,
  ): Promise<SessionDetails> {
    return request(
      '/api/sessions',
      {
        ...requestInit(options),
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
      parseSessionDetails,
    )
  }
}

export const sessionsClient = new HttpSessionsClient()
