import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_QUERY = 'sessionId'

function readSelectedSession(): string | null {
  return new URLSearchParams(window.location.search).get(SESSION_QUERY)
}

function writeSessionUrl(sessionId: string | null): void {
  const url = new URL(window.location.href)
  url.pathname = '/sessions'
  if (sessionId) {
    url.searchParams.set(SESSION_QUERY, sessionId)
  } else {
    url.searchParams.delete(SESSION_QUERY)
  }
  window.history.pushState({}, '', url)
}

export function useSessionUrl() {
  const [selectedId, setSelectedId] = useState<string | null>(() => readSelectedSession())
  const openedFromList = useRef(false)

  useEffect(() => {
    const handlePopState = () => setSelectedId(readSelectedSession())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const openSession = useCallback((sessionId: string) => {
    openedFromList.current = true
    writeSessionUrl(sessionId)
    setSelectedId(sessionId)
  }, [])

  const closeSession = useCallback(() => {
    if (openedFromList.current && readSelectedSession()) {
      openedFromList.current = false
      window.history.back()
    } else {
      const url = new URL(window.location.href)
      url.pathname = '/sessions'
      url.searchParams.delete(SESSION_QUERY)
      window.history.replaceState({}, '', url)
    }
    setSelectedId(null)
  }, [])

  return { selectedId, openSession, closeSession }
}
