# Component Smoke Test Harness

Date: 2026-06-23

Issue: PLRNUI-20

## Configured

- Added a lightweight Node test harness using `node --test`, `tsx`, and `react-test-renderer`.
- Added a test-only `react-native` loader/shim under `tests/` so smoke tests can render React Native component trees in Node without adding runtime native dependencies.
- Added `tests/setup.ts` for React Native/React test globals used by the harness.
- Added `tests/components/component-smoke.test.tsx` as the first render smoke coverage pass, with one smoke assertion per priority component plus a grouped composition render.

## Test Script

```bash
npm test
```

Current script:

```bash
node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/react-native-loader.mjs --test tests/**/*.test.tsx
```

## Components Covered

- Button
- Box
- Row
- Column
- Divider
- Text
- Heading
- Spinner
- Alert
- Badge
- Input
- Switch
- Checkbox

The test file also renders the priority component group together inside `ThemeProvider` to catch basic provider/export composition regressions.

## Deferred

- Navigation and overlay components are not covered in this first pass because they are not part of the controlled first-tranche root API.
- Interaction assertions beyond "renders without throwing" are deferred to later component-specific tickets.
- Native runtime validation on device/simulator is still separate from this Node smoke harness.

## Known Limits

- The `react-native` shim is test-only and validates render compatibility, not native layout, native events, platform accessibility behavior, or Metro bundling.
- `react-test-renderer` is used only as a minimal first-pass render harness; future PLRNUI work can replace or augment it if a fuller React Native testing stack is adopted.
- The local environment currently runs Node `v20.19.2`, while this package declares Node `>=22`; npm reports `EBADENGINE` warnings during install.

## Stable Promotion Gate

This harness is a prerequisite for stable promotion, not proof of stability. A component must still satisfy the component maturity criteria, public API review, dependency policy, documentation expectations, and component-specific tests before it can be promoted to stable.
