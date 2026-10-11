import { describe, expect, it } from 'vitest'
import { parseSessionsResponse } from './normalize'

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

describe('parseSessionsResponse', () => {
  it('rejects timestamps without an explicit timezone', () => {
    expect(() => parseSessionsResponse({
      data: [{ ...summary, startsAt: '2026-08-10T10:30:00' }],
      meta: { page: 1, pageSize: 10, total: 1 },
    })).toThrow('response was not valid')
  })
})
