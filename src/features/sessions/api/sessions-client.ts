import type {
  CoachesResponse,
  CreateSessionRequest,
  SessionDetails,
  SessionStatus,
  SessionsResponse,
} from '../model/contracts'

export interface RequestOptions {
  signal?: AbortSignal
}

export interface SessionsClient {
  listSessions(input: {
    query?: string
    status?: SessionStatus
    signal?: AbortSignal
  }): Promise<SessionsResponse>
  getSession(sessionId: string, options?: RequestOptions): Promise<SessionDetails>
  listCoaches(options?: RequestOptions): Promise<CoachesResponse>
  createSession(input: CreateSessionRequest, options?: RequestOptions): Promise<SessionDetails>
}
