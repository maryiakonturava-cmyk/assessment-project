# TASK-001: UI Design

## Product Context

Training operator uses workspace repeatedly during working day to scan scheduled basketball sessions, compare capacity, resolve scheduling questions, inspect details, and create sessions. Design favors operational speed, clear status, stable dimensions, restrained decoration, and visible recovery actions.

Reference inputs:

- `frontend-accelerator-assessment/designs/DESIGN_TOKENS.md`
- `frontend-accelerator-assessment/designs/sessions-dashboard-reference.svg`
- `tasks/TASK-001/requirements.md`
- `tasks/TASK-001/architecture.md`
- `tasks/TASK-001/api-integration.md`

No existing application screens or design system exist. Supplied fallback direction is sufficient; no additional visual-direction choice is required.

## Selected Direction

Operational dashboard:

- Light `#F5F7F8` canvas.
- White work surfaces with thin `#D7DEE0` borders.
- Dark navigation rail on desktop.
- Teal `#087F72` for primary action and active state.
- Dense scan-friendly session list rather than marketing composition.
- Details presented in a right-side panel on desktop and full-screen sheet/view on mobile.
- Status always includes readable text or familiar symbol; color supports meaning but never carries it alone.
- Use neutral product label such as “Training Sessions”; reference SVG hierarchy is guidance, not required branding.
- Use locally available UI sans-serif, 4px spacing base, 40px controls, 44px mobile touch targets, and maximum 6px control radius.

Reference SVG communicates hierarchy and density only. Do not copy its optional type filter, sample data, dates, brand name, or fixed dimensions as requirements.

## Information Hierarchy

1. **Workspace identity:** page heading “Training Sessions” and short operational description.
2. **Primary action:** “Create session” remains visible in page header on desktop and top action area on mobile.
3. **Find and narrow:** search input, one status filter, and “Clear filters” when any filter is active.
4. **Result context:** count of returned sessions and active-filter context.
5. **Session scan:** title/type/location, local start/duration, coach, capacity/booked count, and status.
6. **Session inspection:** selected session details, notes, coach contact, timestamps, and return action.
7. **Recovery:** state-specific error, retry, clear-filter, create, return, or open-created-session actions.

## Layout Structure

### Desktop: 1440×900 target

- App shell: approximately 224px dark navigation rail and flexible main area.
- Rail contains product/workspace label and semantic navigation. Sessions is active using text plus active background, not color alone.
- Main area uses 24px outer padding and a maximum width that preserves scan density.
- Header uses `h1`, supporting description, and right-aligned “Create session” button.
- Filter surface spans main content width. Search grows into available space; status select and clear action remain reachable without wrapping at target width.
- Content uses a flexible split when details are open: session list gets remaining width; details panel is approximately 320px and independently scrollable. Details panel may be absent until selection; opening it must not destroy list state.
- List surface uses table-like comparison at desktop. Suggested columns: Session (title, type, location), Start (local date/time, duration), Coach, Capacity (booked/capacity), Status, and an explicit details action.
- Keep numbers aligned with tabular numerals. Keep row height stable and use dividers instead of nested cards.

### Mobile: 390×844 target

- Hide desktop rail; provide compact top bar with page title and a visible navigation/menu control only if other routes exist. Do not leave navigation actions unreachable.
- Use 16px page padding and a single-column flow.
- Header stacks title/description and “Create session” full-width or comfortably sized action.
- Filter surface stacks search, status select, and clear action. Controls remain at least 44px tall. Clear action remains visible when active; do not hide it behind hover.
- Replace table columns with stacked session rows/cards: title and status first, then local start/duration, coach, location, capacity, and one large “Open details” target. All required list information remains visible without horizontal scrolling.
- Details opens as a full-screen sheet/view with a sticky top bar, back/close action, heading/status, and scrollable content. Background content is inert while open.
- Create form uses one column with sticky or clearly reachable bottom actions. Do not place submit controls only below long content without a predictable way to reach them.
- Long titles, locations, notes, and error text wrap; no horizontal page scroll.

## Primary Flow

### Scan, filter, inspect

1. Page opens with heading, create action, filter controls, and list request state.
2. User searches title, coach, or location. Apply trimmed query after a short debounce or deliberate submit; show busy status during request.
3. User selects one status. Search and status combine through API query parameters.
4. User selects a session row or explicit “Open details” button. Details panel/sheet opens and focus moves to its heading or close control.
5. User reviews all details and uses “Back to sessions”/close or browser back. List context and active query/status remain unchanged; focus returns to triggering control.
6. “Clear filters” removes query and status in one action and returns to unfiltered results.

### Create session

1. User activates “Create session”. Show a clearly titled create view/panel with a back action.
2. Form presents required fields in logical groups:
   - Basics: title, session type, visibility.
   - Schedule: date, start time, duration.
   - Assignment: coach.
   - Location: name, address.
   - Notes: description, trainer notes.
3. Labels remain visible; placeholders never replace labels. Use native date/time controls with local-time helper text.
4. Coach control shows loading, available choices, empty, or error state. No fabricated coach options.
5. Submit validates locally. On invalid submit, show summary plus inline errors and focus first invalid field.
6. During create, keep form layout stable, disable duplicate submit, and announce “Saving…” without removing values.
7. On success, show explicit confirmation with session title and actions: “Open session” and, when needed, “Clear filters and show session”.
8. On server/network failure, preserve all values and show actionable retry/error copy near form and at summary level.
9. If leaving dirty form, provide a clear confirmation before discarding entered values where navigation can lose them.

## Interaction Rules

- Use `<button>` for actions and `<a>` for navigation. Do not make generic containers clickable.
- Entire session row may be an explicit button/list item action, but retain an accessible name containing session title and status; avoid nested interactive controls.
- Status treatments:
  - Scheduled: text “Scheduled” plus success indicator.
  - Full: text “Full” plus warning indicator and booked/capacity count.
  - Cancelled: text “Cancelled” plus danger indicator.
  - Completed: text “Completed” plus neutral/completed indicator.
- Capacity always includes numeric text such as “14 booked of 18 places”; progress visuals are supplemental.
- Hover never reveals the only action. Focus and active states use visible 2px `#1769E0` outline with offset.
- Loading labels end with ellipsis: “Loading…”, “Saving…”. Keep pending controls stable.
- Error messages name problem and next action: “Sessions could not load. Try again.”
- Use `Intl.DateTimeFormat` for local date/time and `Intl.NumberFormat` for counts if formatting needs localization.
- Use `font-variant-numeric: tabular-nums` for times, durations, capacities, and counts.
- Use explicit transitions only for opacity/transform when motion helps. Disable non-essential motion under `prefers-reduced-motion`.

## State Matrix

| Surface/state | Visible treatment | Action/recovery |
| --- | --- | --- |
| Initial list loading | List skeleton or stable loading rows; `aria-busy`; filters remain understandable | Wait; do not announce repeated row changes |
| Populated list | Count, scan-friendly rows/table, all required fields | Search, status filter, clear, open details, create |
| No sessions | Distinct empty message, e.g. “No sessions yet.” | “Create session” |
| No filter matches | Distinct message, e.g. “No sessions match these filters.” | “Clear filters” |
| List request error | Inline error surface with concise cause | “Try again”; preserve current filters |
| Invalid filter response | Explain filter issue close to controls | Correct or clear filter |
| Details loading | Panel/sheet heading plus loading content; list remains available on desktop | Wait or close |
| Details success | Full detail hierarchy, status, capacity, contact, notes, timestamps | Close/back; focus restores |
| Details not found | “This session is no longer available.” | Return to sessions |
| Details request error | Error within panel/sheet, not full-page failure | Retry or return |
| Coaches loading | Select disabled with “Loading coaches…” | Wait |
| Coaches success | Select with API-provided options | Continue form |
| Coaches empty/error | Inline explanation; valid submit unavailable | Retry; preserve other form values |
| Form validation failure | Summary plus field errors; invalid fields marked and described | Fix fields; focus first invalid field |
| Create pending | “Saving…” live status; submit disabled after request starts | Wait; no duplicate submit |
| Create success | Success region with title and explicit next actions | Open created session or clear relevant filters |
| Create server/network failure | Form-level error with retry; values preserved | Retry or edit values |
| Optional permission/read-only | Not required baseline; if added, explain disabled mutation | No enabled create action; do not imply authorization guarantee |

## Responsive Behavior

- Use CSS grid/flex, not JavaScript width measurement.
- Main content and list surfaces use `min-width: 0`; long content wraps or clamps only where full details remain available.
- At desktop, keep list and details visible together when details selected. At narrower widths, collapse split layout before content becomes cramped.
- At mobile target width, no table overflow, horizontal page scroll, overlap, or unreachable action. All controls stack in document order.
- Details and create surfaces use contained scrolling and `overscroll-behavior: contain`; background does not scroll while a modal/sheet is active.
- Touch targets are at least 44×44px; use `touch-action: manipulation` for controls.
- Do not rely on hover, pointer precision, or drag interactions.
- Respect safe-area insets if full-screen mobile sheet reaches viewport edges.
- Keep sticky headers/actions within viewport without obscuring focused fields.

## Accessibility And Interaction

### Semantics

- One useful `h1` per workspace; `h2` for list, details, and create sections; maintain heading order.
- Add skip link to main content.
- Use native `<form>`, `<label>`, `<input>`, `<select>`, `<textarea>`, `<button>`, and desktop `<table>` semantics before ARIA.
- Every control has a visible label or an explicit accessible name. Icon-only close/menu buttons require `aria-label`; decorative icons use `aria-hidden="true"`.
- Status and mutation feedback use `aria-live="polite"`; urgent blocking errors may use `role="alert"` without duplicating announcements.
- `aria-busy` marks loading regions. `aria-invalid` and `aria-describedby` connect fields to errors.
- Details drawer/sheet has dialog/aside semantics, accessible name, focus containment, Escape close, and background inertness while open.

### Focus and keyboard

- All actions work with keyboard alone; never depend on pointer-only row hover.
- On details open, move focus into panel/sheet. On close/back, restore focus to triggering session control.
- On form submit with errors, focus first invalid field after rendering the error summary.
- On list refresh, do not steal focus from search/filter controls. Announce state change without moving focus unnecessarily.
- Escape closes details/create overlay only when it does not discard dirty data without confirmation.
- Preserve visible `:focus-visible` outline; never remove outline without equivalent replacement.

### Forms

- Use meaningful `name`, `autocomplete`, `inputmode`, and native types (`date`, `time`, `number`, `email` for coach contact display only).
- Date/time labels state local timezone. Display range and character limits near affected controls.
- Do not block paste. Keep labels clickable and touch hit areas unified.
- Inline errors sit near fields; form-level summary links to fields when practical.
- Preserve values on all API failures. Do not clear form until success is confirmed.

### Content and contrast

- Use supplied token contrast relationships; validate text and control contrast in browser verification.
- Do not communicate status by color alone. Pair color with status text/symbol.
- Use active voice and specific actions. Copy avoids raw codes and transport details.
- Long user-entered title, address, description, and notes wrap safely; details view exposes full content.

## Reuse Candidates

Keep these feature-local unless a second consumer proves shared need:

- `StatusLabel` / status indicator with explicit text and icon.
- `CapacitySummary` with booked/capacity text and optional progress visual.
- `AsyncStateMessage` for loading, empty, and retryable errors.
- `FilterBar` with labeled search/status controls and clear action.
- `SessionRow` compositions for desktop scan and mobile stack.
- `DetailsPanel`/`DetailsSheet` focus and scroll behavior.
- `Field` wrapper connecting label, hint, error, and control IDs.
- `FormErrorSummary` with focus/link behavior.
- `LiveRegion` for pending/success/error announcements.

Avoid a generic dashboard card abstraction or boolean-heavy “variant” component until repeated use is demonstrated.

## Unresolved Decisions

- `writing-plans` must map this interaction model to concrete files and choose exact primitive implementation.
- `ui-designer` does not choose API state ownership; architecture/API artifacts define those boundaries.
- Exact icon set is open; choose locally available, accessible icons or familiar text symbols without adding a dependency solely for decoration.
- Exact breakpoint below the required 1440px/390px targets is implementation detail; behavior must remain usable between them.
- Optional type filtering, URL filter synchronization, pagination, cancellation, and permission states remain out of baseline scope.
