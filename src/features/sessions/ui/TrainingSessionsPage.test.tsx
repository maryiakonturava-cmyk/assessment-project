import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDetails, SessionsResponse } from '../model/contracts'
import { SessionsClientError } from '../model/errors'
import type { SessionsClient } from '../api/sessions-client'
import { TrainingSessionsPage } from './TrainingSessionsPage'

const session = {
  id: 'ses_101',
  title: 'U14 Shooting Lab',
  type: 'training' as const,
  status: 'scheduled' as const,
  startsAt: '2026-08-10T10:30:00Z',
  durationMinutes: 60,
  capacity: 20,
  bookedCount: 4,
  visibility: 'public' as const,
  coach: { id: 'coach_01', name: 'Maya Brooks', email: 'maya@example.test' },
  location: { name: 'North Court', address: '18 Harbor Street' },
  updatedAt: '2026-07-27T12:00:00Z',
}

const details: SessionDetails = {
  ...session,
  description: 'Mechanics and repetitions',
  trainerNotes: 'Bring the shot clock',
  createdAt: '2026-07-18T12:30:00Z',
  cancellation: null,
}

function listResponse(data = [session]): SessionsResponse {
  return { data, meta: { page: 1, pageSize: 10, total: data.length } }
}

function createClient(overrides: Partial<SessionsClient> = {}): SessionsClient {
  return {
    listSessions: vi.fn().mockResolvedValue(listResponse()),
    getSession: vi.fn().mockResolvedValue(details),
    listCoaches: vi.fn().mockResolvedValue({ data: [session.coach] }),
    createSession: vi.fn().mockResolvedValue(details),
    ...overrides,
  }
}

function fillValidCreateForm() {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Future shooting lab' } })
  fireEvent.change(screen.getByLabelText('Session type'), { target: { value: 'training' } })
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-08-10' } })
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:30' } })
  fireEvent.change(screen.getByLabelText('Coach'), { target: { value: 'coach_01' } })
  fireEvent.change(screen.getByLabelText('Location name'), { target: { value: 'North Court' } })
  fireEvent.change(screen.getByLabelText('Location address'), { target: { value: '18 Harbor Street' } })
}

describe('TrainingSessionsPage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/sessions')
  })

  it('shows loading then populated results and sends search/status filters', async () => {
    let resolveList: (value: SessionsResponse) => void = () => undefined
    const pendingList = new Promise<SessionsResponse>((resolve) => { resolveList = resolve })
    const client = createClient({ listSessions: vi.fn().mockReturnValue(pendingList) })
    render(<TrainingSessionsPage client={client} />)

    expect(screen.getByLabelText('Loading sessions…')).toBeInTheDocument()
    resolveList(listResponse())
    expect((await screen.findAllByText('U14 Shooting Lab')).length).toBeGreaterThan(0)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search title, coach, or location' }), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'scheduled' } })
    await waitFor(() => expect(client.listSessions).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'Maya', status: 'scheduled' })))
  })

  it('shows distinct empty and no-match recovery states', async () => {
    const client = createClient({ listSessions: vi.fn().mockResolvedValue(listResponse([])) })
    render(<TrainingSessionsPage client={client} />)
    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search title, coach, or location' }), { target: { value: 'none' } })
    expect(await screen.findByText('No sessions match these filters.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0)
  })

  it('preserves entered values after create server failure', async () => {
    const client = createClient({
      createSession: vi.fn().mockRejectedValue(new SessionsClientError({ kind: 'api', status: 500, code: 'CREATE_SESSION_FAILED', message: 'The session could not be created.', fieldErrors: { startsAt: 'Start must be in the future.' } })),
    })
    render(<TrainingSessionsPage client={client} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create session' }))
    await waitFor(() => expect(screen.getByLabelText('Coach')).not.toBeDisabled())
    fillValidCreateForm()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Create session$/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /^Create session$/ }))

    expect(await screen.findByText('The session could not be created.')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Title')).toHaveValue('Future shooting lab')
  })

  it('closes details without leaving a duplicate history entry', async () => {
    const client = createClient()
    render(<TrainingSessionsPage client={client} />)
    const openButtons = await screen.findAllByRole('button', { name: 'Open details' })
    fireEvent.click(openButtons[0])
    expect(await screen.findByRole('dialog', { name: 'Session details' })).toBeInTheDocument()
    expect(screen.getByText('Training')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to sessions' }))
    await waitFor(() => expect(window.location.search).toBe(''))
    expect(screen.queryByRole('dialog', { name: 'Session details' })).not.toBeInTheDocument()
  })

  it('includes the focused details heading in the focus trap', async () => {
    const client = createClient()
    render(<TrainingSessionsPage client={client} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Open details' }))[0])
    await screen.findByRole('dialog', { name: 'Session details' })
    const heading = screen.getByRole('heading', { name: 'U14 Shooting Lab' })
    expect(heading).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Back to sessions' })).toHaveFocus()
  })

  it('moves focus to the first invalid create field', async () => {
    const client = createClient()
    render(<TrainingSessionsPage client={client} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create session' }))
    await waitFor(() => expect(screen.getByLabelText('Coach')).not.toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: /^Create session$/ }))
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveFocus())
  })

  it('shows create success and opens the created session', async () => {
    const created: SessionDetails = { ...details, id: 'ses_new', title: 'New Shooting Lab' }
    const listSessions = vi.fn().mockResolvedValue(listResponse())
    const client = createClient({
      listSessions,
      getSession: vi.fn().mockResolvedValue(created),
      createSession: vi.fn().mockResolvedValue(created),
    })
    render(<TrainingSessionsPage client={client} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create session' }))
    await waitFor(() => expect(screen.getByLabelText('Coach')).not.toBeDisabled())
    fillValidCreateForm()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Create session$/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /^Create session$/ }))

    expect(await screen.findByText('New Shooting Lab was created.')).toBeInTheDocument()
    await waitFor(() => expect(listSessions.mock.calls.length).toBeGreaterThan(1))
    fireEvent.click(screen.getByRole('button', { name: 'Open session' }))
    expect(await screen.findByRole('dialog', { name: 'New Shooting Lab' })).toBeInTheDocument()
  })

  it('shows list request errors and recovers on retry', async () => {
    const clientError = new SessionsClientError({ kind: 'api', status: 500, code: 'SESSIONS_UNAVAILABLE', message: 'Sessions cannot be loaded right now.' })
    const listSessions = vi.fn()
      .mockRejectedValueOnce(clientError)
      .mockResolvedValue(listResponse())
    const client = createClient({ listSessions })
    render(<TrainingSessionsPage client={client} />)

    expect(await screen.findByText('Sessions could not load.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect((await screen.findAllByText('U14 Shooting Lab')).length).toBeGreaterThan(0)
  })

  it('ignores an older list response after filters change', async () => {
    let resolveFirst: (value: SessionsResponse) => void = () => undefined
    let resolveSecond: (value: SessionsResponse) => void = () => undefined
    const listSessions = vi.fn()
      .mockReturnValueOnce(new Promise<SessionsResponse>((resolve) => { resolveFirst = resolve }))
      .mockReturnValueOnce(new Promise<SessionsResponse>((resolve) => { resolveSecond = resolve }))
    const client = createClient({ listSessions })
    render(<TrainingSessionsPage client={client} />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search title, coach, or location' }), { target: { value: 'new' } })
    resolveSecond(listResponse([{ ...session, id: 'ses_new', title: 'New result' }]))
    expect((await screen.findAllByText('New result')).length).toBeGreaterThan(0)
    resolveFirst(listResponse())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.getAllByText('New result').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('U14 Shooting Lab')).toHaveLength(0)
  })

  it('keeps the last successful list visible when refresh fails', async () => {
    const clientError = new SessionsClientError({ kind: 'api', status: 500, code: 'SESSIONS_UNAVAILABLE', message: 'Sessions cannot be loaded right now.' })
    const listSessions = vi.fn()
      .mockResolvedValueOnce(listResponse())
      .mockRejectedValueOnce(clientError)
    const client = createClient({ listSessions })
    render(<TrainingSessionsPage client={client} />)

    expect((await screen.findAllByText('U14 Shooting Lab')).length).toBeGreaterThan(0)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search title, coach, or location' }), { target: { value: 'updated' } })
    expect(await screen.findByText('Sessions cannot be loaded right now.')).toBeInTheDocument()
    expect(screen.getAllByText('U14 Shooting Lab').length).toBeGreaterThan(0)
  })

  it('shows the list error when refreshing an empty successful list fails', async () => {
    const clientError = new SessionsClientError({ kind: 'api', status: 500, code: 'SESSIONS_UNAVAILABLE', message: 'Sessions cannot be loaded right now.' })
    const listSessions = vi.fn()
      .mockResolvedValueOnce(listResponse([]))
      .mockRejectedValueOnce(clientError)
    const client = createClient({ listSessions })
    render(<TrainingSessionsPage client={client} />)

    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search title, coach, or location' }), { target: { value: 'updated' } })
    expect(await screen.findByText('Sessions could not load.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('does not restore details after the drawer is closed', async () => {
    let resolveDetails: (value: SessionDetails) => void = () => undefined
    const client = createClient({
      getSession: vi.fn().mockReturnValue(new Promise<SessionDetails>((resolve) => { resolveDetails = resolve })),
    })
    render(<TrainingSessionsPage client={client} />)

    fireEvent.click((await screen.findAllByRole('button', { name: 'Open details' }))[0])
    expect(await screen.findByRole('dialog', { name: 'Session details' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close session details' }))
    resolveDetails(details)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('dialog', { name: 'U14 Shooting Lab' })).not.toBeInTheDocument()
  })

  it('does not confirm when leaving an untouched create form via navigation', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const client = createClient()
    render(<TrainingSessionsPage client={client} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create session' }))
    fireEvent.click(screen.getByRole('link', { name: 'Sessions' }))
    expect(confirm).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Training sessions' })).toBeInTheDocument()
    confirm.mockRestore()
  })
})
