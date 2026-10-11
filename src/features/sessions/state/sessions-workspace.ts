import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionStatus } from '../model/contracts'
import type { SessionsClient } from '../api/sessions-client'
import { SessionsClientError, toClientError } from '../model/errors'
import { useSessionUrl } from './session-url'

type SessionsResponse = Awaited<ReturnType<SessionsClient['listSessions']>>

export type ListState =
  | { status: 'loading'; previous?: SessionsResponse }
  | { status: 'success'; data: SessionsResponse }
  | { status: 'error'; error: SessionsClientError; previous?: SessionsResponse }

export type DetailsState =
  | { status: 'idle' }
  | { status: 'loading'; sessionId: string }
  | { status: 'success'; session: Awaited<ReturnType<SessionsClient['getSession']>> }
  | { status: 'error'; sessionId: string; error: SessionsClientError }

export function useSessionsWorkspace(client: SessionsClient) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SessionStatus | ''>('')
  const [listState, setListState] = useState<ListState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [detailsReloadToken, setDetailsReloadToken] = useState(0)
  const { selectedId, openSession, closeSession } = useSessionUrl()
  const [detailsState, setDetailsState] = useState<DetailsState>({ status: 'idle' })
  const listRequestId = useRef(0)
  const detailsRequestId = useRef(0)

  useEffect(() => {
    const requestId = ++listRequestId.current
    const controller = new AbortController()
    setListState((current) => ({
      status: 'loading',
      previous: current.status === 'success' ? current.data : current.previous,
    }))

    void client.listSessions({ query, status: status || undefined, signal: controller.signal })
      .then((data) => {
        if (requestId === listRequestId.current) {
          setListState({ status: 'success', data })
        }
      })
      .catch((error: unknown) => {
        if (requestId !== listRequestId.current) {
          return
        }
        const clientError = toClientError(error)
        if (clientError.kind !== 'aborted') {
          setListState((current) => ({
            status: 'error',
            error: clientError,
            previous: current.status === 'success' ? current.data : current.previous,
          }))
        }
      })

    return () => controller.abort()
  }, [client, query, reloadToken, status])

  useEffect(() => {
    const requestId = ++detailsRequestId.current
    if (!selectedId) {
      setDetailsState({ status: 'idle' })
      return
    }

    const controller = new AbortController()
    setDetailsState({ status: 'loading', sessionId: selectedId })

    void client.getSession(selectedId, { signal: controller.signal })
      .then((session) => {
        if (requestId === detailsRequestId.current) {
          setDetailsState({ status: 'success', session })
        }
      })
      .catch((error: unknown) => {
        if (requestId !== detailsRequestId.current) {
          return
        }
        const clientError = toClientError(error)
        if (clientError.kind !== 'aborted') {
          setDetailsState({ status: 'error', sessionId: selectedId, error: clientError })
        }
      })

    return () => controller.abort()
  }, [client, detailsReloadToken, selectedId])

  const retryList = useCallback(() => setReloadToken((value) => value + 1), [])
  const retryDetails = useCallback(() => setDetailsReloadToken((value) => value + 1), [])
  const clearFilters = useCallback(() => {
    setQuery('')
    setStatus('')
  }, [])

  return {
    query,
    setQuery,
    status,
    setStatus,
    listState,
    retryList,
    retryDetails,
    clearFilters,
    selectedId,
    openSession,
    closeSession,
    detailsState,
  }
}
