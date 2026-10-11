# TASK-001: Architecture Decision

## Decision Needed

Define frontend boundaries, routing/context ownership, data flow, failure containment, and test seams for the Training Sessions Workspace. The repository has one frontend candidate at its root, but no production `src/` application exists yet. The root `package.json` currently contains only MSW and Vitest-related setup; required React 19, TypeScript, and Vite application scaffolding remains implementation work.

## Existing Constraints

- Requirements source: `tasks/TASK-001/requirements.md`.
- External API authority: `frontend-accelerator-assessment/API_CONTRACT.md`.
- Required mock boundary: MSW 2.14.6 with stateful create and fixture-clock rebasing.
- Required framework/runtime: React 19, TypeScript 5.9 or newer, Vite 7 or newer, npm.
- Assessment input directory is read-only.
- No backend, authentication, attendee management, or required optional extensions.
- Current repository exposes no established application module or routing pattern to preserve.
- Common architecture rules require separated UI, domain behavior, external integration, and application wiring; one clear owner per state; and recovery near integration boundaries.
- React rules favor state decoupling, explicit composition, lifted state when siblings need shared access, and no boolean-prop variant proliferation.

## Options And Trade-Offs

### Routing and details presentation

1. **No router; sessions page with details drawer and browser history entry** — selected. Keeps dependency surface small for one required workspace, preserves list context naturally, and can use `history.pushState`/`popstate` for a deep-linkable session identifier. Requires a small explicit URL adapter and careful focus restoration.
2. **Add a client router** — rejected for this scope. It would provide route conventions, but adds a dependency and setup for one page when routing is optional and no existing router exists.
3. **Modal without URL state** — rejected. It preserves list state but weakens deep-linkability and browser back-button behavior.

### Remote-data ownership

1. **Feature-owned request controllers/hooks backed by `fetch`** — selected. Required data volume is small, request states are explicit, and this avoids adding a data library solely for React patterns. The API client remains replaceable and tests can inject/mock the client.
2. **Add a server-state library** — rejected. No current dependency or demonstrated cache/invalidation complexity justifies it. Reconsider only if scope grows to background refresh, pagination, or multiple shared consumers.
3. **Load fixtures directly in components** — rejected. Violates the API boundary and prevents replacement by a real backend.

### List filtering state

1. **Feature page owns query and one status value; fetch uses those values** — selected. Search/status are remote query inputs, not a second client-side copy of the complete list. Rendered rows derive from the latest response.
2. **Fetch all sessions and filter locally** — rejected. The mock contract requires filtering in `GET /api/sessions`; local filtering would bypass that behavior and make request/error states inaccurate.
3. **Global store** — rejected. No cross-page consumer requires persisted client state.

### Form state

1. **Local create-form controller/provider** — selected. Form values, field errors, form error, pending state, and success state have one owner. A small provider/context is allowed only if split form sections or sibling actions require shared access; otherwise use the controller directly with explicit props.
2. **Global form store** — rejected. Form state is transient and must not survive unrelated navigation or create multiple sources of truth.
3. **Reset form on every failed request** — rejected. Requirements explicitly require preserving entered values after API failure.

## Confirmed Decision

Use a root Vite React application organized by feature boundary, with one sessions feature and a thin application shell:

```text
src/
  app/                 # bootstrap, app shell, route/URL adapter, global error containment
  features/sessions/   # page composition, models, request controllers, create form behavior
    api/               # typed client for /api/sessions and /api/coaches
    model/             # contract types, local view models, normalization, error mapping
    state/             # list/details/create controllers and state interfaces
    ui/                # list, details drawer, filters, create form, state feedback
  mocks/               # MSW handlers, scenario selection, fixture rebasing, in-memory state
  shared/              # only demonstrated cross-feature UI/utilities; keep initially minimal
```

Exact file names remain implementation-plan decisions. The feature owns session behavior. `app` owns bootstrap and navigation integration. `mocks` owns assessment transport behavior and never leaks scenario names into presentation components.

Use a single `/sessions` workspace. Opening details creates a browser history entry containing the selected session identifier, while list query/filter state remains owned by the sessions page for the active view. Closing details or browser back removes the selection and restores the same list instance. If direct URL entry contains a session identifier, the page loads that detail and provides a clear path to the list; missing or invalid identifiers use the contracted details error behavior.

Do not add a router, global state library, or server-state library for required scope. Use platform history APIs and React state/hooks behind small adapters. Any later dependency proposal must document reason, bundle/setup cost, and replacement impact before addition.

## Boundaries And Dependency Direction

Dependency direction:

```text
app wiring -> features/sessions -> api/model
app wiring -> mocks (development/test bootstrap only)
features/sessions/ui -> feature state interfaces and view models
features/sessions/state -> feature api interfaces
feature api implementation -> browser fetch
mocks -> contract types and supplied fixtures
shared -> no feature-specific imports
```

Rules:

- UI components consume typed state/actions and view models; they do not call `fetch`, import fixtures, inspect scenario names, or build API URLs.
- Feature state/controllers depend on an injected sessions client interface. Default runtime wiring supplies the HTTP client; tests can supply deterministic fakes.
- The HTTP client owns endpoint paths, request serialization, response parsing, ISO timestamp validation/normalization, and conversion of `ApiError` payloads into typed client errors.
- The mock layer owns scenario selection, fixture-clock rebasing, request validation, stateful in-memory created sessions, and response shaping. It must expose ordinary HTTP success/error responses to the client.
- Contract types stay aligned with `API_CONTRACT.md`. Local view models may be derived after the client boundary; no silent contract changes.
- Shared UI/utilities require at least two real consumers. Keep one-off session behavior inside `features/sessions`.
- Prefer explicit status/result variants over combinations of boolean props. Components needing alternate composition should receive explicit children or separate feature-level compositions.
- React 19 APIs may be used where appropriate: pass `ref` as a regular prop and use `use` for context consumption. Do not introduce compatibility wrappers without a demonstrated need.

## State, Data, And Failure Flow

### List

1. Sessions page owns `query` and `status` input state, selected session identifier, and the latest list request state.
2. Query/status changes trigger `GET /api/sessions` through the client. The request includes only supported contract parameters.
3. The controller exposes discriminated states such as `loading`, `success`, and `error`; success includes response data and metadata.
4. Abort or ignore stale list requests so an older response cannot overwrite newer query/filter results.
5. Empty response (`data.length === 0` with a successful request) renders the no-sessions or no-matches message based on whether active filters/search exist. This distinction is derived, not separately stored.
6. Retry reuses current query/filter state and replaces the request state.

### Details

1. Selected session identifier is owned by the sessions page/URL adapter, not duplicated in the drawer.
2. Details controller requests `GET /api/sessions/:sessionId` when selection changes and exposes loading, success, and error states.
3. Details retry uses the same identifier. Closing details clears selection and restores focus to the triggering control when available.
4. Details errors remain local to the details surface; list content and filters remain usable.

### Coaches and create

1. Create flow owns form draft values and validation state locally. It requests coaches through the injected client when the form becomes available or when the page requires the choices.
2. Coaches failure disables valid coach selection/submission and exposes retry/recovery. The form must not fabricate coach options.
3. Client-side validation runs before POST. It uses local date/time conversion to produce an ISO UTC `startsAt` and verifies future-start and numeric/string rules.
4. On valid submit, the controller sets pending before issuing `POST /api/sessions`; duplicate submits are ignored while pending.
5. On `400`, map `fieldErrors` to controls and preserve draft values. On other failures, preserve draft values and expose a form-level retryable error.
6. On `201`, retain returned `SessionDetails` as the authoritative created result, show explicit success, and refresh the list through the client. If active filters exclude the new session, offer open-created-session or clear-relevant-filters action rather than silently claiming it is visible.
7. Do not optimistically insert a session. The contract provides stateful successful responses, and server response remains source of truth.

### Time and normalization

Fixture timestamp rebasing happens only in MSW startup/handlers. The client receives ISO 8601 UTC strings, validates/parses them at the integration boundary, and exposes normalized values to presentation. UI formatting uses the browser's local timezone. Components do not know `referenceNow` or fixture offsets.

### Failure containment

- HTTP/client failures become typed feature request errors with contracted code/message retained for useful recovery and test assertions.
- List, details, coaches, and create errors render recovery UI at their nearest feature boundary while preserving the application shell.
- A top-level React error boundary protects the shell from unexpected render failures and provides reload/recovery messaging; it is not used to replace request-state handling.
- No network or scenario branching appears in presentation components.

## Performance, Security, And Testability

- Five default sessions do not justify virtualization, speculative prefetching, or a caching library. Keep list rendering straightforward and avoid duplicate fetches caused by unstable effect dependencies.
- Abort/ignore stale reads and avoid updating unmounted controllers. Keep pending controls dimensionally stable.
- Do not log request bodies, coach contact data, or user-entered notes. Do not add analytics, credentials, or persistent storage for assessment data.
- Test client/controller behavior with injected client fakes or MSW responses; test UI through observable behavior and accessible labels. Cover query/status requests, loading, empty/no-match distinction, list/details error recovery, create validation, pending duplicate prevention, success, and server-failure draft preservation.
- Keep browser scenario selection outside product UI. Browser evidence should exercise ordinary user-visible states, not internal scenario branches.

## Risks And Mitigations

- **Custom history adapter drift:** Keep adapter limited to session selection, use `popstate`, and cover open/back/close behavior in browser verification.
- **Request race conditions:** Abort or sequence list/details reads and test rapid query/selection changes.
- **Stale list after create:** Refetch from server after success and provide explicit discoverability action when filters hide the result.
- **Contract leakage:** Centralize endpoint parsing and error mapping in `api`; review UI imports for fixture/transport access.
- **Over-abstraction in new app:** Start with feature-local modules and add shared boundaries only after repeated use.

## Rejected Alternatives

- Direct fixture imports in React components.
- Client-side filtering of a complete fixture list.
- Global state store for list/form state.
- New router dependency for one required workspace.
- New server-state/data library without demonstrated scope need.
- Optimistic create without rollback requirements or backend idempotency.
- Backend endpoint changes or invented API fields.

## Implementation Implications

- `writing-plans` must translate these boundaries into concrete files and sequence app scaffolding, MSW bootstrap, client, feature controllers, UI, and tests.
- `api-integration` must define the exact client interface, typed error mapping, scenario boundary, fixture rebasing, and stateful create behavior without changing endpoint authority.
- `ui-designer` must choose drawer focus/inertness details, responsive list representation, status treatment, and form feedback composition within these boundaries.
- `coder` must keep implementation inside the root application, leave `frontend-accelerator-assessment/` unchanged, and add only dependencies justified in task documentation.
- No architecture update is required in `specs/architecture.md`; this document records task-specific proposed/confirmed architecture for a not-yet-implemented application.
