export type MockScenario =
  | 'normal'
  | 'empty'
  | 'list-error'
  | 'details-error'
  | 'coaches-error'
  | 'create-error'
  | 'create-conflict'
  | 'unknown-session'

let override: MockScenario | undefined

export function setMockScenario(scenario: MockScenario | undefined): void {
  override = scenario
}

export function getMockScenario(): MockScenario {
  if (override) {
    return override
  }

  const configured = import.meta.env.VITE_MOCK_SCENARIO as MockScenario | undefined
  return configured ?? 'normal'
}
