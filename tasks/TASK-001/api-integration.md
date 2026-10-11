# TASK-001: API Integration

## Confirmed Contract

Source authority: `frontend-accelerator-assessment/API_CONTRACT.md` and `MOCKING_GUIDE.md`. These are assessment inputs and remain unchanged.

### Transport and data

- Base path: `/api`.
- Timestamps crossing the client boundary are ISO 8601 UTC strings.
- UI displays timestamps in the user's local timezone.
- No authentication or permission endpoint is required for the required scope.
- Application uses ordinary HTTP requests. Components and the API client do not import fixture JSON.
- Required mock transport: `msw@2.14.6`.

### Required endpoints

| Operation | Request | Success | Contract errors |
| --- | --- | --- | --- |
| `GET /api/sessions` | `query` string and one `status` value, both optional | `200 SessionsResponse` with `data` and `meta.page`, `meta.pageSize`, `meta.total` | `400 INVALID_FILTER`; `500 SESSIONS_UNAVAILABLE` |
| `GET /api/sessions/:sessionId` | Path `sessionId` | `200 SessionDetails` | `404 SESSION_NOT_FOUND`; `500 SESSION_DETAILS_UNAVAILABLE` |
| `GET /api/coaches` | None | `200 CoachesResponse` | `500 COACHES_UNAVAILABLE` |
| `POST /api/sessions` | `CreateSessionRequest` JSON | `201 SessionDetails` | `400 VALIDATION_FAILED` with optional `fieldErrors`; `500 CREATE_SESSION_FAILED`; optional `409 COACH_SCHEDULE_CONFLICT` |

### Contract behavior

- List filtering searches title, coach name, and location case-insensitively.
- Status filtering accepts one supported status and occurs before `meta.total` is calculated.
- Default list uses supplied five-session fixture data with `page: 1` and `pageSize: 10`.
- Successful create returns generated identifiers/timestamps, echoes normalized submitted values, uses the selected coach fixture, and makes the new session available through later list and details reads.
- Client prevents duplicate create submissions; client does not manufacture idempotency guarantees.
- Fixture timestamps are shifted at mock startup by the difference between actual current time and `referenceNow`; only the mock boundary knows this transformation.
- Required mock scenarios: `normal`, `empty`, `list-error`, `details-error`, `coaches-error`, and `create-error`.
- Scenario selection belongs to mock/test infrastructure and must not appear in presentation branching.
- Cancellation, conflict, permission, refresh, and unknown-session scenarios are optional and excluded from required client behavior.

## Assumed Contract

These are implementation assumptions, not new backend requirements:

- Browser `fetch` is the transport because no existing client wrapper or transport library exists in the repository. Keep it behind the client interface so it can be replaced.
- Successful and error responses use JSON bodies matching the contract. A non-JSON or malformed body is treated as a client integration failure, not converted into a fabricated API error.
- Browser local timezone is the user's local timezone for display and future-start validation.
- `AbortSignal` can be passed to requests for stale-read cancellation. This changes request control, not endpoint shape.
- An empty `data` array from `GET /api/coaches` is possible because the contract permits an array without a minimum length. The form must show no available coaches and block valid submission rather than inventing options.
- Optional blank `description` and `trainerNotes` values may serialize as `null`; both fields are contractually nullable when present.

## Proposed Contract

These are frontend-only interfaces and policies. They do not change backend endpoints or response shapes.

### Client interface

```ts
interface SessionsClient {
  listSessions(
    input: {
      query?: string;
      status?: SessionStatus;
      signal?: AbortSignal;
    },
  ): Promise<SessionsResponse>;

  getSession(
    sessionId: string,
    options?: { signal?: AbortSignal },
  ): Promise<SessionDetails>;

  listCoaches(options?: { signal?: AbortSignal }): Promise<CoachesResponse>;

  createSession(
    input: CreateSessionRequest,
    options?: { signal?: AbortSignal },
  ): Promise<SessionDetails>;
}
```

The concrete HTTP implementation owns URL construction, request serialization, `response.ok` handling, JSON decoding, response shape checks, and conversion to typed errors. Feature controllers depend only on `SessionsClient`.

### Typed frontend errors

```ts
interface ClientError {
  kind: "api" | "network" | "malformed" | "aborted";
  status?: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
}
```

- `kind: "api"` preserves contracted `code`, `message`, and `fieldErrors` from an HTTP error body.
- `kind: "network"` covers fetch rejection other than abort. User-facing copy must not expose raw exception details.
- `kind: "malformed"` covers an unexpected success/error payload or invalid required timestamp. This is an integration defect state, not a backend contract addition.
- `kind: "aborted"` is silent for stale requests and non-destructive cancellation; it must not overwrite newer state or show a false failure.

### Validation boundary

- Form/domain validation runs before `createSession`: trimmed lengths, required values, integer ranges, future local date/time, supported enum selections, and trainer-note maximum.
- Mock handler validates request contract fields, enum values, coach ID, positive duration/capacity, and valid ISO timestamp, returning contracted `400 VALIDATION_FAILED` responses.
- HTTP client validates response shape and timestamp format at the integration boundary. Presentation receives typed, valid data and does not know fixture rebasing.
- The client must not silently rename, add, remove, or coerce required API fields beyond documented request serialization.

### Retry, cancellation, caching, and idempotency

- No automatic retries. GET retry is user-triggered from the relevant error state; POST retry is user-triggered and uses preserved form values.
- List and details reads accept `AbortSignal`; controllers abort or ignore stale requests when query/filter/session selection changes.
- Create accepts a signal for lifecycle cleanup but remains pending-protected until settled; no automatic abort-and-resubmit behavior.
- No cache or deduplication layer for required scope. A successful create triggers an explicit list refresh; response data remains server/mock authoritative.
- No idempotency key is added because contract does not provide one.

### Mock boundary

Mock setup owns:

1. Scenario configuration for required deterministic scenarios.
2. Fixture loading and fixture-clock rebasing at startup.
3. `GET /api/sessions` query/status filtering and filtered metadata.
4. Details lookup and contracted not-found/error behavior.
5. Coach response/error behavior.
6. Create request validation, generated identifiers/timestamps, selected-coach lookup, in-memory persistence, and subsequent list/details visibility.

The client sees only ordinary HTTP responses. UI receives no scenario name and contains no transport-condition branch.

## Frontend States And Errors

| Surface | Trigger/response | Client state | User-visible behavior | Recovery/data policy |
| --- | --- | --- | --- | --- |
| Sessions list | Initial request not settled | `loading` | Loading indicator with accessible status | No stale data on first load |
| Sessions list | `200`, `data.length > 0` | `success: populated` | Render all required summary fields | Replace previous result with latest response |
| Sessions list | `200`, empty data, no active query/status | `success: empty` | Distinct no-sessions message | Offer create-session action |
| Sessions list | `200`, empty data, active query/status | `success: no-matches` | Distinct no-matches message | Clear filters/search; retain current inputs until action |
| Sessions list | `400 INVALID_FILTER` | `error: invalid-filter` | Useful filter error; do not show misleading results | Clear invalid input or retry after correction |
| Sessions list | `500 SESSIONS_UNAVAILABLE` | `error: unavailable` | List unavailable message and retry | Preserve current query/status; retry same request |
| Sessions list | Network/malformed response | `error: integration` | Generic load failure without raw exception details | Retry; log only safe diagnostic metadata if needed |
| Sessions list | Stale request aborted | `aborted` / ignored | No error flash | Newest request remains authoritative |
| Session details | Selection set, request pending | `loading` | Drawer loading state; list stays usable | Keep list query/filter state |
| Session details | `200 SessionDetails` | `success` | Show list fields, description, notes, capacity, coach contact, timestamps | Close/back clears selection and restores trigger focus |
| Session details | `404 SESSION_NOT_FOUND` | `error: not-found` | Session unavailable message and return-to-list action | Do not mutate list; clear stale selection on exit |
| Session details | `500 SESSION_DETAILS_UNAVAILABLE` | `error: unavailable` | Details unavailable message and retry | Keep drawer/list context; retry same ID |
| Session details | Network/malformed response | `error: integration` | Generic details failure and retry | Keep list usable |
| Session details | Stale request aborted | `aborted` / ignored | No error flash | Newest selected ID remains authoritative |
| Coaches | Request pending | `loading` | Coach control loading/disabled state | Prevent valid submission until choices ready |
| Coaches | `200` with choices | `success` | Render API-provided coach options | No invented options |
| Coaches | `200` with empty array | `success: empty` | No coaches available message; submission unavailable | Retry if supported; do not fabricate coach |
| Coaches | `500 COACHES_UNAVAILABLE` | `error: unavailable` | Coach loading failure and retry | Preserve other form values; block submission |
| Coaches | Network/malformed response | `error: integration` | Generic coach-load failure and retry | Preserve form values |
| Create form | Local invalid values | `validation-error` | Field errors near controls, associations via `aria-describedby`, form-level summary when needed | Do not issue POST; preserve all values |
| Create form | Valid submit in progress | `pending` | Disable duplicate submit; stable control dimensions; announced pending status | Preserve draft until settled |
| Create form | `201 SessionDetails` | `success` | Explicit creation confirmation and open-created-session/clear-filter action as needed | Use returned session as authoritative; refresh list |
| Create form | `400 VALIDATION_FAILED` | `error: validation` | Map returned `fieldErrors`; show top-level message for unmapped errors | Preserve draft; allow correction/resubmit |
| Create form | Optional `409 COACH_SCHEDULE_CONFLICT` | `error: conflict` | Explain coach conflict and request correction | Preserve draft; no automatic retry |
| Create form | `500 CREATE_SESSION_FAILED` | `error: server` | Useful server-failure message and retry action | Preserve draft; no automatic retry |
| Create form | Network/malformed response | `error: integration` | Generic creation failure and retry | Preserve draft; avoid duplicate assumptions |
| Create form | Aborted/unmounted request | `aborted` / ignored | No false success or failure | Preserve draft if form remains mounted |

## Request and Response Handling

### List request

- Trim search input before sending; omit empty `query`.
- Omit empty `status`.
- Send one status only from `scheduled`, `full`, `cancelled`, or `completed`.
- Do not apply client-side filtering to replace server filtering.
- Require `meta.page`, `meta.pageSize`, and `meta.total`; preserve metadata for future pagination without implementing pagination now.

### Details request

- Encode `sessionId` as a path segment.
- Do not synthesize details from list summaries when request fails.
- Treat `404 SESSION_NOT_FOUND` as a normal recoverable user state, not a generic crash.

### Coaches request

- Use returned `CoachSummary` records as the only valid choices.
- Keep coach contact data available for details display but do not expose unnecessary data in logs.

### Create request

- Serialize exact contract fields: `title`, `type`, `startsAt`, `durationMinutes`, `coachId`, `locationName`, `locationAddress`, `capacity`, `visibility`, and optional `description`/`trainerNotes`.
- Normalize strings according to form validation before submission.
- Convert local date/time to ISO UTC `startsAt` only after confirming future start.
- Do not send display-only coach or location objects in place of `coachId`, `locationName`, and `locationAddress`.
- Use returned `SessionDetails`; do not fabricate generated identifiers or timestamps on the client.

## Mocking And Tests

### Mock scenario coverage

Record scenario selection in test/browser evidence, not in presentation logic. Required scenario outcomes:

- `normal`: successful list/details/coaches/create.
- `empty`: successful list with no sessions.
- `list-error`: list request error.
- `details-error`: details request error.
- `coaches-error`: coach request error.
- `create-error`: create request error with preserved draft.

### Integration seams

- Unit-test request serialization, query/status parameter handling, ISO timestamp validation, API error mapping, field-error mapping, and malformed response handling.
- Controller tests inject a `SessionsClient` fake to verify loading/success/error transitions, stale request handling, retry inputs, and create pending protection.
- MSW integration tests verify filtering occurs at handler level, `meta.total` reflects filtering, fixture rebasing stays inside mock boundary, stateful create appears in later list/details calls, and required error codes/statuses are returned.
- UI tests assert accessible labels, visible state messages, disabled pending submit, field error association, preserved form values, and created-session recovery action.
- Browser evidence must inspect console, page errors, failed network requests, and required state flows.

## Questions For Backend Owner

No required backend clarification blocks implementation because assessment contract and mock behavior define the required boundary. Keep these items recorded as contract limits:

1. `fieldErrors` on `VALIDATION_FAILED` are optional; UI must support partial or absent field mappings with a form-level message.
2. `COACH_SCHEDULE_CONFLICT` is optional and must not be required for the baseline implementation.
3. Cancellation and permission errors are optional and excluded from baseline client surface.
4. The contract does not define authentication headers, cache validators, rate limits, timeout semantics, or idempotency keys; the client must not invent them.
5. Scenario selection mechanism is intentionally an assessment-infrastructure decision. `coder`/`writing-plans` must document the chosen mock configuration without exposing it as product UI.

Any endpoint, field, status, or error-code change requires explicit proposal and evaluator approval. This document does not change the external contract.
