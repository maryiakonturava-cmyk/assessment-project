import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpSessionsClient } from './http-sessions-client'

const summary = {
  id: 'ses_101',
  title: 'Shooting Lab',
  type: 'training',
  status: 'scheduled',
  startsAt: '2026-08-10T10:30:00Z',
  durationMinutes: 60,
  capacity: 20,
  bookedCount: 4,
  visibility: 'public',
  coach: { id: 'coach_01', name: 'Maya Brooks', email: 'maya@example.test' },
  location: { name: 'North Court', address: '18 Harbor Street' },
  updatedAt: '2026-07-27T12:00:00Z',
}

function response(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

describe('HttpSessionsClient', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('serializes supported list filters and parses response data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [summary], meta: { page: 1, pageSize: 10, total: 1 } }))
    vi.stubGlobal('fetch', fetchMock)
    const client = new HttpSessionsClient()

    const result = await client.listSessions({ query: ' Maya ', status: 'scheduled' })

    expect(result.data[0]?.title).toBe('Shooting Lab')
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions?query=Maya&status=scheduled', expect.objectContaining({ headers: { Accept: 'application/json' } }))
  })

  it('maps contracted API errors and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Check the submitted fields.',
        fieldErrors: { title: 'Title is required.' },
      },
    }, false, 400)))
    const client = new HttpSessionsClient()

    await expect(client.createSession({
      title: '', type: 'training', startsAt: '2026-08-10T10:30:00Z', durationMinutes: 60,
      coachId: 'coach_01', locationName: 'North Court', locationAddress: '18 Harbor Street',
      capacity: 20, visibility: 'public',
    })).rejects.toMatchObject({ kind: 'api', status: 400, code: 'VALIDATION_FAILED', fieldErrors: { title: 'Title is required.' } })
  })
})
