import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { setMockScenario } from './scenario-config'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  server.resetHandlers()
  setMockScenario(undefined)
})

describe('MSW handler boundary', () => {
  it('filters sessions at the API boundary and recalculates total', async () => {
    const response = await fetch('http://localhost/api/sessions?query=Varsity&status=full')
    const body = await response.json() as { data: Array<{ title: string }>; meta: { total: number } }

    expect(response.status).toBe(200)
    expect(body.meta.total).toBe(1)
    expect(body.data[0]?.title).toBe('Varsity Defense Intensive')
  })

  it('persists a successful create for later details reads', async () => {
    const response = await fetch('http://localhost/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Boundary Test Session',
        type: 'training',
        startsAt: '2099-08-10T10:30:00.000Z',
        durationMinutes: 60,
        coachId: 'coach_01',
        locationName: 'North Court',
        locationAddress: '18 Harbor Street',
        capacity: 20,
        visibility: 'public',
        description: null,
        trainerNotes: null,
      }),
    })
    const created = await response.json() as { id: string; title: string }

    expect(response.status).toBe(201)
    expect(created.title).toBe('Boundary Test Session')

    const detailsResponse = await fetch(`http://localhost/api/sessions/${created.id}`)
    expect(detailsResponse.status).toBe(200)
  })
})
