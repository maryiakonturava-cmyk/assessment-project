import coachesFixture from '../../frontend-accelerator-assessment/fixtures/coaches.json'
import details101 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_101.json'
import details102 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_102.json'
import details103 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_103.json'
import details104 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_104.json'
import details105 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_105.json'
import sessionsFixture from '../../frontend-accelerator-assessment/fixtures/sessions.json'
import type {
  CoachSummary,
  CreateSessionRequest,
  SessionDetails,
  SessionSummary,
} from '../features/sessions/model/contracts'
import { rebaseRecord } from './fixture-clock'

const detailFixtures = [details101, details102, details103, details104, details105]
const referenceNow = Date.now()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toSummary(details: SessionDetails): SessionSummary {
  const {
    description: _description,
    trainerNotes: _trainerNotes,
    createdAt: _createdAt,
    cancellation: _cancellation,
    ...summary
  } = details
  return summary
}

function rebaseDetails(fixture: SessionDetails): SessionDetails {
  return rebaseRecord(fixture as unknown as Record<string, unknown>, referenceNow) as unknown as SessionDetails
}

function rebaseSummary(fixture: SessionSummary): SessionSummary {
  return rebaseRecord(fixture as unknown as Record<string, unknown>, referenceNow) as unknown as SessionSummary
}

const initialDetails = detailFixtures.map((fixture) => rebaseDetails(fixture as SessionDetails))
const initialSummaries = sessionsFixture.data.map((fixture) => rebaseSummary(fixture as SessionSummary))

export const coachChoices: CoachSummary[] = clone(coachesFixture.data)

class SessionStore {
  private summaries = new Map(initialSummaries.map((session) => [session.id, session]))
  private details = new Map(initialDetails.map((session) => [session.id, session]))

  list(): SessionSummary[] {
    return clone([...this.summaries.values()])
  }

  get(id: string): SessionDetails | undefined {
    const session = this.details.get(id)
    return session ? clone(session) : undefined
  }

  create(input: CreateSessionRequest): SessionDetails {
    const coach = coachChoices.find((choice) => choice.id === input.coachId)
    if (!coach) {
      throw new Error('Unknown coach')
    }

    const now = new Date().toISOString()
    const details: SessionDetails = {
      id: `ses_${Date.now()}`,
      title: input.title,
      type: input.type,
      status: 'scheduled',
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      capacity: input.capacity,
      bookedCount: 0,
      visibility: input.visibility,
      coach: clone(coach),
      location: {
        name: input.locationName,
        address: input.locationAddress,
      },
      description: input.description ?? null,
      trainerNotes: input.trainerNotes ?? null,
      createdAt: now,
      updatedAt: now,
      cancellation: null,
    }

    this.details.set(details.id, details)
    this.summaries.set(details.id, toSummary(details))
    return clone(details)
  }
}

export const sessionStore = new SessionStore()
