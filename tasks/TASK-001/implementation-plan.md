# TASK-001: Implementation Plan

## Current Behavior

- Repository root is the only frontend application candidate.
- No production `src/` application, Vite entry, React runtime, client wrapper, mock handlers, or UI exists yet.
- `package.json` contains `msw@2.14.6`, TypeScript, and Vitest, but no scripts and no React/Vite application dependencies.
- `public/mockServiceWorker.js` exists.
- Assessment input under `frontend-accelerator-assessment/` is read-only.
- Requirements, architecture, API integration, and UI design artifacts are complete in `tasks/TASK-001/`.

## Intended Behavior

Deliver one root Vite/React Training Sessions Workspace that:

- Loads and displays sessions through `/api/sessions`.
- Searches title, coach, and location through server-side query filtering.
- Filters by one status and clears active filters.
- Shows readable status and capacity information.
- Opens session details in a desktop side panel or mobile full-screen sheet while preserving list context.
- Loads coach choices and creates future sessions through the contracted API.
- Validates form input, prevents duplicate submission, preserves draft values on failure, and exposes explicit success/discoverability actions.
- Supports all required loading, populated, empty, no-match, details/list/coaches error, validation, pending, success, and create-failure states.
- Works at 1440×900 and 390×844 without horizontal page scrolling.
- Uses MSW scenarios and fixture-clock rebasing behind the mock boundary.
- Includes focused behavior tests and documented start/check scripts.

## Preconditions And Confirmed Decisions

- Implement only in repository root; do not edit `frontend-accelerator-assessment/`.
- Use React 19, TypeScript 5.9 or newer, Vite 7 or newer, npm, and `msw@2.14.6`.
- Do not add a router, global state library, server-state library, UI kit, or icon dependency for baseline scope.
- Use a feature-owned `SessionsClient` interface and browser `fetch` implementation.
- Use platform history with `/sessions` and a selected session identifier for details deep-linking; list query/status state remains owned by the workspace.
- Keep request state in feature controllers, form state local to create flow, and mock scenario selection inside `src/mocks`.
- Use server/mock response as create authority; refresh list after `201`, with explicit action when filters hide new session.
- Apply supplied fallback tokens and operational dashboard direction from `tasks/TASK-001/ui-design.md`.
- Exact file names below are implementation targets, not new product or API decisions.

## Ordered File Changes

### 1. Scaffold runtime and project entry

**Modify:** `package.json`

- Add React 19 runtime dependencies, React DOM types, Vite 7-compatible build dependencies, and any test environment dependencies required by behavior tests.
- Preserve `msw@2.14.6`.
- Add project scripts for documented development start, production build, tests, and type checking only after the corresponding tooling/configuration exists.
- Record dependency reasons in task documentation: React/Vite/plugin for required runtime; Testing Library + jsdom only for behavior-level DOM tests; no router/data/UI library because architecture rejects them.

**Modify:** `package-lock.json`

- Update lockfile from package changes. Do not hand-edit generated dependency resolution.

**Create:** `index.html`

- Provide the Vite document shell, viewport metadata, app mount, skip-link-compatible document structure, and theme color matching canvas.

**Create:** `vite.config.ts`

- Configure React plugin and Vite entry/build behavior.
- Keep MSW development startup wiring in application bootstrap, not in UI components.

**Create:** `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

- Enable strict TypeScript, browser DOM types, JSX, and Vite config typing.
- Keep path aliases minimal or omit them until repeated imports justify them.

**Contract:** Runtime must start from root and provide a typed React/Vite application before feature implementation proceeds.

### 2. Define contract models, local errors, normalization, and validation

**Create:** `src/features/sessions/model/contracts.ts`

- Mirror API contract types: `SessionType`, `SessionStatus`, `Visibility`, `CoachSummary`, `LocationSummary`, `SessionSummary`, `SessionDetails`, `SessionsResponse`, `CoachesResponse`, `CreateSessionRequest`, and `ApiError`.
- Preserve endpoint field names and enum values exactly.

**Create:** `src/features/sessions/model/errors.ts`

- Define frontend `ClientError` kinds: API, network, malformed, and aborted.
- Preserve contracted status/code/message/field errors without exposing raw transport details in UI copy.

**Create:** `src/features/sessions/model/normalize.ts`

- Validate required response shapes and ISO timestamps at client boundary.
- Convert API errors into `ClientError`.
- Provide display helpers/view models for local-time formatting without exposing fixture-clock concepts to UI.

**Create:** `src/features/sessions/model/validation.ts`

- Validate trimmed title, future local date/time, integer duration/capacity, required coach, location lengths, and trainer-notes maximum.
- Convert valid local date/time into ISO UTC `startsAt`.
- Return field-keyed errors and form-level errors without issuing a request.

**Contract:** API models remain contract-shaped; local validation errors and view models remain downstream of the transport boundary. No component imports fixture data.

### 3. Implement MSW mock boundary

**Create:** `src/mocks/fixture-clock.ts`

- Read `referenceNow` and rebase every supplied fixture timestamp at mock startup.
- Keep transformation isolated to mock setup.

**Create:** `src/mocks/scenario-config.ts`

- Select required scenarios through development/test infrastructure configuration.
- Keep scenario names out of product components and client method signatures.
- Document chosen selection mechanism in workflow/evidence artifacts after implementation.

**Create:** `src/mocks/session-store.ts`

- Load default fixture data, keep rebased in-memory sessions/details, generate created identifiers/timestamps, and make successful creates visible to later list/details reads.
- Use selected coach fixture for successful create.

**Create:** `src/mocks/handlers.ts`

- Implement `GET /api/sessions`, `GET /api/sessions/:sessionId`, `GET /api/coaches`, and `POST /api/sessions`.
- Apply case-insensitive query matching across title/coach/location before calculating `meta.total`.
- Return exact required status codes/error codes and validate create request contract.
- Support `normal`, `empty`, `list-error`, `details-error`, `coaches-error`, and `create-error`.

**Create:** `src/mocks/browser.ts`

- Create/start MSW browser worker with handlers for local development.
- Keep worker startup before rendering requests can occur.

**Contract:** Mock handlers expose ordinary HTTP responses only. No fixture rebasing or scenario branches leak into `src/features/sessions/ui` or client consumers.

### 4. Implement replaceable frontend client

**Create:** `src/features/sessions/api/sessions-client.ts`

- Export `SessionsClient` interface from API artifact.
- Define request options with optional `AbortSignal`.

**Create:** `src/features/sessions/api/http-sessions-client.ts`

- Implement exact `/api` paths and query serialization.
- Trim/omit empty list query/status values.
- Encode details ID as a path segment.
- Serialize exact create fields and nullable optional text.
- Parse success/error JSON, validate response shapes/timestamps, map API/network/malformed/aborted failures, and avoid raw exception leakage.
- Do not add retries, caching, idempotency keys, or client-side replacement filtering.

**Create:** `src/features/sessions/api/index.ts`

- Export default client factory/instance and public client types without exposing transport internals.

**Contract:** Feature state imports `SessionsClient`; only concrete client imports browser transport. Tests can inject a deterministic fake.

### 5. Implement feature state and URL ownership

**Create:** `src/features/sessions/state/session-url.ts`

- Own `/sessions` selected-session history entry and `popstate` handling.
- Open details with session identifier, close/back without losing active list state, and restore focus target through UI integration.

**Create:** `src/features/sessions/state/sessions-workspace.ts`

- Own query/status inputs, list request state, selected ID, details request state, and retry actions.
- Abort/ignore stale list/details requests.
- Derive no-sessions vs no-matches from successful empty data and active filters.
- Preserve list context while details is open.

**Create:** `src/features/sessions/state/create-session.ts`

- Own form draft, dirty state, field/form errors, coach request state, pending flag, success result, retry, and discoverability action.
- Block duplicate submits.
- Preserve draft values on all API failure paths.
- On success, use returned `SessionDetails`, refresh list, and expose open-created-session/clear-filter action.

**Contract:** Each state has one owner. Controllers consume `SessionsClient` and return discriminated observable states to UI.

### 6. Implement application shell and feature UI

**Create:** `src/app/App.tsx`

- Mount one `/sessions` workspace, global shell, top-level render-error containment, and route/URL adapter wiring.
- Keep app shell usable when feature request fails.

**Create:** `src/app/main.tsx`

- Bootstrap React root and start MSW in development/test-compatible mode before rendering.
- Inject default `SessionsClient` into feature boundary.

**Create:** `src/app/app.css`

- Define canvas/surface/text/border/primary/focus/status tokens, typography, spacing, focus-visible treatment, reduced-motion rules, safe-area handling, and overflow prevention.

**Create:** `src/features/sessions/ui/TrainingSessionsPage.tsx`

- Compose heading, primary create action, filters, list, details surface, and state feedback.
- Keep request state and actions passed through typed feature interfaces.

**Create:** `src/features/sessions/ui/SessionFilters.tsx`

- Labeled search and status controls, active-filter indication, clear action, busy state, and accessible error placement.

**Create:** `src/features/sessions/ui/SessionList.tsx`

- Desktop semantic comparison table and mobile stacked representation using same session data/actions.
- Render title/type/location, local start/duration, coach, capacity/booked count, readable status, and explicit details action.
- Distinguish initial loading, populated, no-sessions, no-match, and list-error states.

**Create:** `src/features/sessions/ui/SessionDetailsSurface.tsx`

- Desktop side panel and mobile full-screen sheet.
- Render all list information plus description, notes, capacity, coach contact, and timestamps.
- Handle loading, success, not-found, request error, retry, close/back, focus containment/restoration, Escape, inert background, and contained scrolling.

**Create:** `src/features/sessions/ui/CreateSessionView.tsx`

- Group basics, schedule, assignment, location, and notes fields.
- Use native labels/types/input modes, visible limits, local-time explanation, coach loading/error/empty behavior, validation summary, inline errors, pending protection, success actions, and failure-preserved values.

**Create:** `src/features/sessions/ui/StatusLabel.tsx`

- Render explicit status text plus non-color indicator for all four statuses.

**Create:** `src/features/sessions/ui/CapacitySummary.tsx`

- Render numeric booked/capacity text and optional supplemental progress visual.

**Create:** `src/features/sessions/ui/AsyncStateMessage.tsx`

- Feature-local loading, empty, and retryable error messaging with live-region semantics where appropriate.

**Create:** `src/features/sessions/ui/FormErrorSummary.tsx`

- Announce form-level errors and link/focus field errors without duplicating announcements.

**Contract:** UI uses semantic controls and state interfaces only. No fetch, fixture import, scenario branch, raw API code, or color-only status logic.

### 7. Add focused behavior and integration tests

**Create:** `src/features/sessions/model/validation.test.ts`

- Cover valid future conversion and invalid title/date/time/duration/capacity/coach/location/notes rules.
- Confirm invalid form data produces no create request when used through controller seam.

**Create:** `src/features/sessions/api/http-sessions-client.test.ts`

- Cover query/status serialization, create serialization, API error mapping, field errors, malformed response handling, and abort classification.

**Create:** `src/mocks/handlers.test.ts`

- Cover server-side query/status filtering, filtered `meta.total`, fixture timestamp rebasing, stateful successful create, and required scenario status/error codes.

**Create:** `src/features/sessions/ui/TrainingSessionsPage.test.tsx`

Keep four to six focused behavior tests, using injected client/MSW behavior rather than implementation details:

1. Initial loading transitions to populated results; search and status filtering issue expected requests and render results.
2. Successful empty list and filtered no-match list show distinct messages with clear/create recovery.
3. Create validation prevents request; successful create disables duplicate submission while pending, shows success, refreshes list, and exposes discoverability action.
4. Create server failure preserves all entered values and offers retry.
5. List or details request error shows useful recovery while preserving usable workspace/list context.
6. Coach request failure blocks valid coach selection/submission and preserves form values.

**Create:** `src/test/setup.ts`

- Configure Vitest DOM environment and matcher setup if Testing Library dependencies are added.

**Modify:** `vitest.config.ts`

- Configure TypeScript/React test environment, setup file, and test include paths.

**Contract:** Tests assert user-visible behavior, accessible names, request outcomes, and state transitions. Avoid brittle component implementation assertions.

### 8. Document runtime scripts and implementation evidence

**Modify:** `README.md` or create a project-level runtime README only if no existing project README exists.

- Document actual app start command, mock behavior, scenario selection, and evaluator reproduction steps after coder verifies them.
- Do not document commands that were not run.

**Create/update during implementation:** `tasks/TASK-001/workflow-log.md`

- Record role ordering, chosen scenario mechanism, runtime setup, and pre-coder planning checkpoint as required by evidence protocol. This is workflow evidence, not production code.

## Contracts And Dependencies

| Boundary | Producer | Consumer | Required contract |
| --- | --- | --- | --- |
| API models | `model/contracts.ts` | client, mocks, state | Exact fields/enums from `API_CONTRACT.md` |
| Client | `http-sessions-client.ts` | feature state | `SessionsClient`, typed `ClientError`, abort support |
| Mock transport | `src/mocks/*` | browser fetch | Exact `/api` paths/statuses/error bodies; stateful create |
| List state | `sessions-workspace.ts` | page/list/details | query/status ownership, request state, selected ID, retries |
| Create state | `create-session.ts` | form/success actions | draft preservation, validation, pending guard, returned details |
| UI state | feature UI | operator | Accessible, responsive states from `ui-design.md` |

Dependency additions:

- Required runtime/build: React 19, React DOM, Vite 7-compatible React plugin, and type packages as needed by strict TypeScript.
- Required existing: `msw@2.14.6`, Vitest, TypeScript.
- Behavior-test-only: Testing Library and jsdom if the selected test setup needs DOM rendering. Trade-off: extra dev dependencies and setup in exchange for behavior-level accessibility/interaction assertions; no production runtime cost.
- Explicitly excluded: router, server-state library, global store, UI component library, icon package, analytics, auth, and persistence layer.

## Essential Tests

Required before coder handoff is considered complete:

- Search and status filter behavior reaches server query boundary and renders filtered results.
- Create validation covers required/range/length/future-time rules.
- Create success covers pending duplicate prevention, explicit success, list refresh, and discoverability.
- Create server failure preserves entered values.
- Initial loading is observable.
- No sessions and filter no-match states are distinct and recoverable.
- One list or details request-error state has useful retry/return behavior.
- MSW handler filtering, stateful create, fixture rebasing, and required error codes are covered.

## Additional Risk-Based Tests

Add only if implementation complexity or review findings justify them:

- Rapid query changes do not allow stale list response to win.
- Rapid details selection does not show prior session in newer panel.
- Browser back/Escape/close restore details focus and list context.
- Dirty create navigation warns before discarding values.
- Malformed response and aborted request do not produce uncaught errors or false success.
- Very long titles, addresses, notes, and error messages wrap without overflow.
- Keyboard-only details/form operation and mobile target reachability.
- Contrast/status indicator and reduced-motion assertions through browser verification.

## Verification Commands

Commands discovered before implementation:

- `node ./toolchain/bin/doctor.mjs --json` — documented accelerator/runtime doctor command.
- No `dev`, `build`, `test`, `typecheck`, or lint scripts currently exist in `package.json`.

The coder must add and document project scripts as part of scaffolding, then run and record actual command output. Do not claim any check passed before execution. Browser verification must separately record discovered URL, viewport evidence, console/page errors, network failures, and server ownership.

## Risks And Rollback

- **Incomplete scaffold:** package currently lacks React/Vite/scripts. Mitigation: complete runtime entry and scripts before feature work; verify doctor and app start before UI integration.
- **Fixture coupling:** mock imports may reference assessment fixtures. Keep those imports limited to `src/mocks`; never import fixtures from API/UI; leave assessment directory unchanged.
- **History/focus regressions:** custom session URL adapter is small but easy to break. Cover open/back/close/Escape and focus restoration in UI/browser verification.
- **Stale async responses:** abort or sequence list/details requests and add risk test if implementation uses effects.
- **Filtered create invisibility:** use returned create details and provide explicit open/clear-filter action after refresh.
- **Dependency drift:** record every added package and reason; do not add router/data/UI libraries without a new architecture decision.

No feature flag is justified for this standalone assessment. Rollback means removing new `src/`, config, and package changes while preserving `frontend-accelerator-assessment/` and task evidence artifacts.
