# ADR 0018: Testing renderer for rendered tests

## Status

Accepted (2026-10-12). Ticket PLRNUI-106 (E12-03). Decided by the executing agent within the scope of the ticket ("evaluate and decide, then document"); not a product-owner decision. Revisit when the React Native test stack changes (see Consequences).

## Context

The rendered tests use `react-test-renderer` with a hand-written `react-native` shim (`tests/shims/react-native.tsx`, mapped by `tests/react-native-loader.mjs`). Queries are `findByType` / `findByProps` on host names that the shim invents (`"View"`, `"Pressable"`), so the tests do not exercise testing-library semantics (queries by role, label or text, user events), and a test can pass against a tree no user could operate. The ticket asks to evaluate real React Native or `@testing-library/react-native` (RNTL) on `node:test`, decide, document, add a `renderWithTheme` helper and port the `core-controls` test as proof, while the shim stays unchanged and every test that uses it keeps passing in the same `npm test` run.

## Options evaluated

All four were tried in this repository on 2026-10-12 (Node 22, React 19.2, React Native 0.86 as installed, `node --import tsx --experimental-loader ./tests/react-native-loader.mjs --test`).

1. **jest-expo or the React Native Jest preset.** Needs Jest as the runner plus Babel with the Flow and JSX transforms for the whole `react-native` package, and the preset's setup files. It replaces `node:test` for the whole suite (a different runner, config and mocking model) and cannot run beside the existing tests in one `npm test`. Rejected: it contradicts the "same npm test run" requirement.
2. **RNTL on the real `react-native` under `node:test`.** RNTL is CommonJS and calls `require("react-native")`. The loader hook rewrites only the ES-module specifier, so the request reaches the real package, whose entry is Flow source: `Transform failed ... node_modules/react-native/index.js:27:7: ERROR: Unexpected "typeof"`. Making it work would need a Babel (Flow) register hook over `node_modules/react-native` and the native-module mocks Jest normally provides. Rejected: large, fragile and slower than the benefit.
3. **RNTL 14 (`test-renderer`).** The current RNTL line replaces `react-test-renderer` with the new `test-renderer` package and an asynchronous `render`. On this stack it failed to share the React instance (`Invalid hook call`, two copies of React through the package's own resolution) and would make the ported test and every other test use a different renderer and an async API. Rejected for now; it is the migration path when `react-test-renderer` is removed (it already prints a deprecation notice on React 19).
4. **RNTL 13.3 (`react-test-renderer`) against the existing shim.** RNTL 13 runs on the renderer the suite already uses. Only the CommonJS request for `react-native` needs to reach the shim. This works: render, `getByLabelText`, `UNSAFE_getByProps`, `fireEvent.press` and `fireEvent.changeText` all run. **Chosen.**

## Decision

Use **RNTL 13.3 (`@testing-library/react-native@^13.3.3`, devDependency) on top of the existing shim**, through one helper, `tests/helpers/render.tsx`:

- it routes the CommonJS `require("react-native")` that RNTL performs to the shim (`Module._load` patch limited to that one request), then imports the `pure` entry of RNTL (the default entry registers Jest matchers on a global `expect` and an `afterEach` cleanup, which do not exist under `node:test`);
- it registers an `afterEach(cleanup)` of its own;
- `renderWithTheme(ui, { mode })` renders inside `ThemeProvider` without persistence and returns the RNTL queries; `fireEvent`, `act`, `within`, `waitFor` and `cleanup` are re-exported.

No file under `tests/shims` changes, and tests that import the shim without the helper are unaffected. The helper is opt-in per test file; the patch is per process and `node --test` runs each file in its own process.

`tests/accessibility/core-controls.test.tsx` is ported as the proof: queries by label, events through `fireEvent`, the same `assertAccessibilityContract` assertions.

## Trade-offs and limits (measured, not assumed)

- **`getByRole` on shim `Pressable` does not match.** RNTL treats a host element as accessible only if `accessible` is true, or it is a text, text input or switch. React Native's `Pressable` sets `accessible` by default; the shim's does not. So role queries on Pressable-based controls (Button, Checkbox, Switch, RadioGroup options) fail with the shim (the ported test asserts this, so the gap is visible), and the ported test uses `getByLabelText` plus the role assertion on the found element's props. Role queries work on elements RNTL treats as accessible.
- **The shim does not implement `disabled`.** `fireEvent.press` on a disabled `Pressable` still calls `onPress` against the shim, as against no real component; the test asserts that `disabled` is handed to the pressable instead. A behavioural disabled test needs the real `Pressable`.
- **Host components are still the shim's strings**, not React Native's native components. RNTL's checks of the host tree (pointer events, text matching, visibility) run against that. Real-device behaviour stays covered by the Expo consumer smoke (`scripts/expo-consumer-smoke.mjs`), not by these tests.
- **`screen` is not usable under `node:test`** (a named export bound before the first render); use the queries `render` returns.
- **New dev dependency** (`@testing-library/react-native`, its `pretty-format` / `jest-diff` / `redent` helpers; `package-lock.json` changes). It is never imported by `src`, never published, and is not a runtime or peer dependency.

## Consequences

- Other rendered tests can migrate to `renderWithTheme` one file at a time; none is changed by this ADR.
- Closing the two shim gaps (default `accessible` on `Pressable`, `disabled` blocking presses) needs a change to `tests/shims/react-native.tsx`, which this ticket must not touch; it is a follow-up for the owner of the shim, after which `getByRole` works on all controls.
- When `react-test-renderer` is removed from React, move to RNTL 14 (`test-renderer`) in one step: the helper is the only file that imports RNTL.

## Related Jira issues

- PLRNUI-106 (E12-03)
- PLRNUI-103 (E12-01), the test infrastructure epic entry
- PLRNUI-25, which added the shim (`git log tests/shims/react-native.tsx`)
