# Training Sessions Workspace

Frontend assessment implementation for scanning, inspecting, and creating training sessions.

## Start

```bash
npm install
npm run dev
```

Open URL printed by Vite. Development runtime starts MSW before React renders and serves the contracted `/api` endpoints from in-memory fixtures.

## Mock scenarios

Default scenario: `normal`.

Select a required deterministic scenario with `VITE_MOCK_SCENARIO`:

```bash
VITE_MOCK_SCENARIO=empty npm run dev
VITE_MOCK_SCENARIO=list-error npm run dev
VITE_MOCK_SCENARIO=details-error npm run dev
VITE_MOCK_SCENARIO=coaches-error npm run dev
VITE_MOCK_SCENARIO=create-error npm run dev
```

Scenario selection stays in mock infrastructure and is not exposed as product UI. Fixture timestamps are rebased at mock startup; application code receives ordinary ISO UTC values.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

The app uses React 19, TypeScript, Vite, MSW 2.14.6, and browser `fetch` behind a replaceable sessions client boundary.
