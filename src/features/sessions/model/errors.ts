export type ClientErrorKind = 'api' | 'network' | 'malformed' | 'aborted'

export interface ClientErrorShape {
  kind: ClientErrorKind
  status?: number
  code: string
  message: string
  fieldErrors?: Record<string, string>
  cause?: unknown
}

export class SessionsClientError extends Error implements ClientErrorShape {
  readonly kind: ClientErrorKind
  readonly status?: number
  readonly code: string
  readonly fieldErrors?: Record<string, string>
  readonly cause?: unknown

  constructor(shape: ClientErrorShape) {
    super(shape.message)
    this.name = 'SessionsClientError'
    this.kind = shape.kind
    this.status = shape.status
    this.code = shape.code
    this.fieldErrors = shape.fieldErrors
    this.cause = shape.cause
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function toClientError(error: unknown): SessionsClientError {
  if (error instanceof SessionsClientError) {
    return error
  }

  if (isAbortError(error)) {
    return new SessionsClientError({
      kind: 'aborted',
      code: 'REQUEST_ABORTED',
      message: 'Request was cancelled.',
      cause: error,
    })
  }

  return new SessionsClientError({
    kind: 'network',
    code: 'NETWORK_ERROR',
    message: 'The service could not be reached.',
    cause: error,
  })
}
