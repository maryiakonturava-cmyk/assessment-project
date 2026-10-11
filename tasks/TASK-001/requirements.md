# Training Sessions Workspace Requirements

- Task: `TASK-001`
- Source: `frontend-accelerator-assessment/FRONTEND_ASSESSMENT_SPEC.md`
- Status: Ready for specialist decisions and implementation planning

## Goal

Build a frontend-only Training Sessions Workspace for a busy training-business operator. The operator must be able to scan scheduled work, search and filter sessions, inspect session details, and create a future training session without losing context. The implementation must use the supplied API contract through a replaceable MSW-backed client boundary; no backend is in scope.

## Primary User and Problem

The primary user is a trainer managing multiple basketball programs, coaches, and locations. Their current scheduling information is split across a calendar, spreadsheets, and chat messages. They need one operational workspace optimized for fast scanning, capacity awareness, predictable actions, and visibility into scheduled, full, cancelled, and completed sessions.

## Scope

### Sessions workspace

Provide a route or equivalent navigable view where the user can:

- See each session's title, type, status, local start time, duration, coach, location, capacity, and booked count.
- Search by session title, coach name, or location.
- Apply one status filter.
- Clear all active filters.
- Distinguish scheduled, full, cancelled, and completed sessions using text or familiar symbols in addition to any color.
- Open a session while preserving the current list context.

URL synchronization, session-type filtering, and pagination are optional and not required for this task.

### Session details

Opening a session must display:

- All information shown in the list.
- Description and trainer notes.
- Capacity summary.
- Coach contact summary.
- Created and last-updated timestamps in the user's local timezone.

Details may use a route, drawer, or modal. It must be keyboard accessible, deep-linkable when routing supports it, and return the user to the previous list state.

### Create session

Provide a form with:

- Title.
- Session type.
- Date.
- Start time.
- Duration.
- Coach.
- Location name.
- Location address.
- Capacity.
- Visibility.
- Optional description and trainer notes.

Validation requirements:

- Title: 3–80 trimmed characters.
- Date and time: resolve to a future start in the user's local timezone.
- Duration: integer from 30–240 minutes.
- Capacity: integer from 1–100.
- Coach: required.
- Location name: 2–80 trimmed characters.
- Location address: 3–120 trimmed characters.
- Trainer notes: maximum 500 characters.

Submission must prevent duplicate submissions while pending, show field errors beside controls, show a useful form-level error when needed, preserve entered values after an API failure, expose unambiguous success feedback, and make the created session discoverable. If active filters hide the new session, offer a clear action to open it or reset relevant filters.

## Acceptance Criteria

### AC-1: Session list

Given the sessions workspace is opened, when the list request succeeds with data, then the UI shows title, type, status, local start time, duration, coach, location, capacity, and booked count for each returned session.

### AC-2: Search

Given sessions exist, when the user enters a search query, then results match title, coach name, or location without case sensitivity. The empty filtered result state is distinct from the no-sessions-exist state.

### AC-3: Status filter

Given sessions exist, when the user selects one supported status, then only sessions with that status are shown. Clearing filters restores the unfiltered list.

### AC-4: Status clarity

Scheduled, full, cancelled, and completed statuses remain distinguishable without relying on color alone.

### AC-5: List context preservation

When the user opens a session and then closes it or navigates back, the previous list results and active search/filter state remain available.

### AC-6: Details content and access

When a session opens successfully, details include all list information, description, trainer notes, capacity summary, coach contact summary, created timestamp, and updated timestamp. The experience is operable by keyboard and has an accessible name, focus behavior, and return path appropriate to its chosen presentation.

### AC-7: Create form fields

The create flow exposes every required field and identifies optional description and trainer-notes fields. Coach choices come from the coaches API response.

### AC-8: Create validation

Submitting invalid values prevents the request, associates useful errors with affected controls, and reports form-level failure when appropriate. Future-start, integer-range, length, required, and maximum-length rules are enforced exactly as specified.

### AC-9: Create pending and failure behavior

While creation is pending, duplicate submission is prevented and controls retain stable dimensions. On server failure, entered values remain available and the user receives useful recovery feedback.

### AC-10: Create success and discoverability

On successful creation, the user receives explicit success feedback. The created session can be found in the workspace or can be opened through a clear action when current filters would hide it.

### AC-11: Required observable states

The implementation makes each state observable and testable:

- Initial loading.
- Populated result.
- No sessions exist.
- Filters produce no matches.
- List request failure.
- Details request failure.
- Coaches request failure.
- Create pending.
- Create success.
- Create validation failure.
- Create server failure.

Error and empty states provide useful next actions where the state supports recovery.

### AC-12: API boundary

All application requests use the paths and shapes in `API_CONTRACT.md` through a replaceable frontend client boundary. Presentation components do not import fixture JSON, contain scattered raw transport calls, or branch on mock scenario names. MSW applies query/status filtering at the mock boundary, supports required deterministic scenarios, rebases fixture timestamps at startup, and keeps successful creates available in subsequent list and details reads.

### AC-13: Responsive behavior

At 1440×900 and 390×844, all content and actions remain reachable without overlap or horizontal page scrolling. Desktop supports comparison and repeated actions; mobile may use a different scan-friendly representation.

### AC-14: Accessibility

The workspace provides complete keyboard operation, visible focus states, semantic controls and labels, useful headings, programmatic validation-error association, appropriately announced status and mutation feedback, non-color status indicators, sufficient contrast, and reduced-motion support when motion is used.

### AC-15: Constraints and runtime

The project uses React 19, TypeScript 5.9 or newer, Vite 7 or newer, npm, and `msw@2.14.6`. It works without network access after setup and uses the supplied API contract. Assessment input remains unchanged. No secrets, real personal data, analytics, or production credentials are included.

### AC-16: Required evidence

Before production implementation, requirements and a file-level implementation plan exist. The completed assessment records architecture, API, and UI decisions; automated test output; desktop and mobile populated screenshots; browser evidence for create, empty, and representative error flows; console, page-error, and failed-network observations; a final verification verdict; workflow role/STOP evidence; and developer-reported timing data.

## Non-goals

- Backend implementation.
- Authentication or account registration.
- Payments.
- Real email or notification delivery.
- Drag-and-drop calendar scheduling.
- Recurring session rules.
- Attendee management.
- Organization administration.
- Deployment or public hosting.
- Replacing the supplied product brief with another application.
- Implementing every optional domain idea.
- Required implementation of session-type filtering, URL filter synchronization, pagination, cancellation, permissions, background refresh, optimistic updates, calendar views, or saved-filter views.

## Constraints and Dependencies

- External frontend contract: `frontend-accelerator-assessment/API_CONTRACT.md`.
- Mock behavior: `frontend-accelerator-assessment/MOCKING_GUIDE.md`.
- Required scenarios: `normal`, `empty`, `list-error`, `details-error`, `coaches-error`, and `create-error`.
- Fixture timestamps must be rebased only at the MSW boundary using `fixtures/fixture-clock.json`.
- Visual fallback guidance: `frontend-accelerator-assessment/designs/DESIGN_TOKENS.md` and the supplied dashboard reference SVG.
- Focused tests must cover search/status filtering, create validation and success, create server failure with preserved input, initial loading, no sessions/filtered no matches, and one list or details request-error state.
- Additional dependencies require a recorded reason and trade-off.

## Facts

- Assessment directory is read-only input.
- Candidate task workspace for this run is `TASK-001`.
- The current repository contains no production application source visible in the initial file inventory; implementation specialists must confirm application root and starting code before planning.
- API endpoint paths, required request fields, response fields, and error codes are fixed unless a separately documented proposal receives evaluator approval.

## Assumptions

- `tasks/TASK-001/` is the candidate task workspace for all later role artifacts.
- The supplied assessment directory remains unchanged throughout implementation.
- The application will consume local MSW responses and does not require a live backend.
- The user's local timezone is the browser/runtime timezone used for date display and future-start validation.

These assumptions do not alter living-spec truth or API contract. Architecture and UI specialists must confirm how list context, details presentation, scenario selection, and client state ownership are represented.

## Open Questions and Specialist Ownership

- **Frontend architecture owner (`architect`):** Which client/state ownership and route or overlay boundaries best preserve list context, request states, and created-session discoverability without duplicating server state?
- **API integration owner (`api-integration`):** How will the contracted endpoints, MSW scenarios, fixture-clock rebasing, stateful create behavior, normalization, and error mapping be isolated behind the frontend client boundary?
- **UI owner (`ui-designer`):** What responsive list/detail/create composition, focus management, status treatment, and recovery interactions satisfy the supplied desktop/mobile and accessibility requirements?
- **Implementation planning owner (`writing-plans`):** Which concrete files, tests, sequencing, and verification commands implement approved requirements without changing assessment input?

No product decision is blocked. These are implementation decisions that must be recorded by named specialists before coding.

## Readiness

Requirements are ready for `architect`, `api-integration`, `ui-designer`, and then `writing-plans`. Production implementation must not begin until those required decisions and the file-level implementation plan are recorded. This requirements step stops here; it does not invoke the next role.
