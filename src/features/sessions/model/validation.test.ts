import { describe, expect, it } from 'vitest'
import { initialCreateDraft, validateCreateDraft } from './validation'

describe('validateCreateDraft', () => {
  it('creates a normalized request from valid local form values', () => {
    const result = validateCreateDraft({
      ...initialCreateDraft,
      title: '  Shooting Lab  ',
      type: 'training',
      date: '2026-08-10',
      time: '10:30',
      coachId: 'coach_01',
      locationName: 'North Court',
      locationAddress: '18 Harbor Street',
      description: 'Mechanics and repetitions',
      trainerNotes: 'Bring the shot clock',
    }, new Date('2026-07-27T12:00:00'))

    expect(result.fieldErrors).toEqual({})
    expect(result.request).toMatchObject({
      title: 'Shooting Lab',
      coachId: 'coach_01',
      locationName: 'North Court',
      description: 'Mechanics and repetitions',
      trainerNotes: 'Bring the shot clock',
    })
    expect(result.request?.startsAt).toMatch(/^2026-08-10T/)
  })

  it('returns field errors for invalid and non-future values', () => {
    const result = validateCreateDraft({
      ...initialCreateDraft,
      title: 'x',
      type: 'training',
      date: '2026-07-27',
      time: '11:00',
      durationMinutes: '29',
      capacity: '101',
      locationName: 'x',
      locationAddress: 'x',
      trainerNotes: 'a'.repeat(501),
    }, new Date('2026-07-27T12:00:00'))

    expect(result.request).toBeUndefined()
    expect(result.fieldErrors).toMatchObject({
      title: expect.any(String),
      date: 'Start must be in the future.',
      time: 'Start must be in the future.',
      durationMinutes: expect.any(String),
      capacity: expect.any(String),
      coachId: expect.any(String),
      locationName: expect.any(String),
      locationAddress: expect.any(String),
      trainerNotes: expect.any(String),
    })
  })
})
