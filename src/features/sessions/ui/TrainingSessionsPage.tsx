import { useCallback, useState } from 'react'
import type { MouseEvent } from 'react'
import type { SessionDetails } from '../model/contracts'
import type { SessionsClient } from '../api/sessions-client'
import { useSessionsWorkspace } from '../state/sessions-workspace'
import { CreateSessionView } from './CreateSessionView'
import { SessionDetailsSurface } from './SessionDetailsSurface'
import { SessionFilters } from './SessionFilters'
import { SessionList } from './SessionList'

export function TrainingSessionsPage({ client }: { client: SessionsClient }) {
  const workspace = useSessionsWorkspace(client)
  const [view, setView] = useState<'list' | 'create'>('list')
  const [createDirty, setCreateDirty] = useState(false)
  const hasFilters = Boolean(workspace.query || workspace.status)

  const handleSessionsNavigation = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (view !== 'create') {
      return
    }
    event.preventDefault()
    if (createDirty && !window.confirm('Discard this session draft?')) {
      return
    }
    setCreateDirty(false)
    setView('list')
  }, [createDirty, view])

  const handleCreated = useCallback((_session: SessionDetails) => {
    workspace.retryList()
  }, [workspace])

  const handleCreateDirtyChange = useCallback((isDirty: boolean) => {
    setCreateDirty(isDirty)
  }, [])

  const handleOpenCreated = useCallback((sessionId: string) => {
    setCreateDirty(false)
    setView('list')
    workspace.openSession(sessionId)
  }, [workspace])

  const handleClearFiltersAndOpen = useCallback((sessionId: string) => {
    setCreateDirty(false)
    workspace.clearFilters()
    setView('list')
    workspace.openSession(sessionId)
  }, [workspace])

  return (
    <div className="app-shell">
      <aside className="navigation-rail" aria-label="Workspace navigation">
        <div className="brand">TRAINING<br />OPS</div>
        <nav>
          <a className="nav-link nav-link-active" href="/sessions" aria-current="page" onClick={handleSessionsNavigation}>Sessions</a>
        </nav>
      </aside>
      <main id="main-content" className="main-content">
        {view === 'create' ? (
          <CreateSessionView
            client={client}
            onBack={() => {
              setCreateDirty(false)
              setView('list')
            }}
            onCreated={handleCreated}
            onDirtyChange={handleCreateDirtyChange}
            onOpenCreated={handleOpenCreated}
            onClearFiltersAndOpen={handleClearFiltersAndOpen}
          />
        ) : (
          <>
            <header className="page-header">
              <div>
                <span className="eyebrow">Operations</span>
                <h1>Training sessions</h1>
                <p>Find scheduled work, review capacity, and make schedule changes.</p>
              </div>
              <button className="button button-primary" type="button" onClick={() => setView('create')}>Create session</button>
            </header>
            <SessionFilters
              query={workspace.query}
              status={workspace.status}
              busy={workspace.listState.status === 'loading'}
              onQueryChange={workspace.setQuery}
              onStatusChange={workspace.setStatus}
              onClear={workspace.clearFilters}
            />
            <SessionList
              state={workspace.listState}
              hasFilters={hasFilters}
              onRetry={workspace.retryList}
              onClearFilters={workspace.clearFilters}
              onCreate={() => setView('create')}
              onOpen={workspace.openSession}
            />
            <SessionDetailsSurface
              state={workspace.detailsState}
              onClose={workspace.closeSession}
              onRetry={workspace.retryDetails}
            />
          </>
        )}
      </main>
    </div>
  )
}
