# PLRNUI-62 — Native Runtime Publication Closure

Date: 2026-09-09

## Decision

**G9 / RA 0005 is CLOSED for the selected `0.1.0-rc.1` support boundary by explicit owner acceptance.**

This closes the native-runtime publication blocker only for the support boundary documented below. It does not authorize npm publication, an RC tag, or a GitHub Release. Final publication preparation remains owned by PLRNUI-63 and final authorization by PLRNUI-61.

## Candidate package evidence

Package-content validation commit: `d0b2e43abb7e39ef007ac21c3d02c1945af4aef7` on `plrnui-62-final-closure`.

Environment:

- Node: `v24.20.0`
- npm: `11.19.0`
- package version during evidence run: `0.0.0`
- Node engine: `>=22.13.0`
- React peer: `>=19.2.3 <20.0.0`
- React Native peer: `>=0.86.0 <0.87.0`

Executable evidence:

- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS — 74/74 tests, 14 suites, 0 failures
- `npm run build`: PASS
- `npm run package:dry-run`: PASS
- `npm run consumer:smoke`: PASS
- `npm run consumer:expo`: PASS
- generated Expo consumer dependency tree: Expo `57.0.21`, React `19.2.3`, React DOM `19.2.3`, React Native `0.86.3`
- `npx expo install --check`: PASS — dependencies up to date
- `npx expo-doctor@latest`: PASS — 21/21 checks, no issues detected
- Metro web export from the isolated packed-artifact Expo consumer: PASS

Candidate tarball produced by the final evidence run:

- filename: `personal-library-react-native-components-0.0.0.tgz`
- SHA256: `d714c6f78a89294e802588fc20c93e4db520a255a2b1feff7e80c38692364e78`
- size: `55916` bytes
- npm package size: 55.9 kB
- unpacked size: 245.2 kB
- files: 407
- npm shasum: `a81580c254c001d720c09cb36e8379fd757702e2`

The `0.0.0` artifact above is evidence-only and is not a publishable RC. PLRNUI-63 must assign and validate the actual RC version before publication.

## Fixture remediation discovered during closure

PLRNUI-62 found two validation-fixture defects after PLRNUI-64 landed:

1. The generated stateful `App.tsx` used a nested template literal inside the JavaScript template used to write the fixture. That made `consumer:expo` fail at parse time. The fixture now renders the status line through string concatenation, preserving the intended stateful Input/Button/theme probe.
2. The fixture pinned `react-native-web@0.21.0`, while Expo `57.0.21` expects the compatible `^0.21.2` line. The fixture is now pinned to `react-native-web@0.21.2`.

Both were fixture/preflight defects, not demonstrated runtime defects in library components. After remediation the complete Expo consumer evidence chain passed without `--force`, `--legacy-peer-deps`, source imports, workspace aliases, or Metro aliases.

## Real-device evidence

The maintainer executed and explicitly approved the Expo SDK 57 consumer in Expo Go on a real Android device.

Validated interactions included:

- package root imports and application launch;
- `ThemeProvider` light/dark behavior;
- Button state mutation;
- controlled Input editing using the stateful probe;
- representative `Card`, `Text`, and `Box` rendering.

The earlier `Failed to download remote update` error was resolved as a LAN/firewall reachability problem between the Android device and development PC. It is not classified as a library defect.

## First-RC runtime support boundary

| Runtime path | PLRNUI-62 disposition | Meaning for `0.1.0-rc.1` |
| --- | --- | --- |
| Expo Go Android — Expo SDK 57 / RN 0.86.3 | **PASS / maintainer approved** | Validated native-runtime lane for the first RC. |
| Native Android outside Expo Go proof | **OWNER-ACCEPTED RESIDUAL** | Not a validated PASS; accepted for this RC without broadening the support claim. |
| Native iOS | **OWNER-ACCEPTED RESIDUAL** | Not a validated PASS; accepted for this RC without broadening the support claim. |
| Prebuild | **N/A to selected first-RC claim** | No package-owned native module requires a prebuild claim. Reopen if claimed later. |
| Custom dev client | **N/A to selected first-RC claim** | Not part of the selected first-RC support boundary. |
| EAS build | **N/A to current publication plan** | No paid/cloud build is required or authorized for this gate. |

## Residual-risk rule

Native Android/iOS residual acceptance is intentionally scoped to `0.1.0-rc.1`. It must not be represented as platform PASS evidence. Reopen RA 0005 before broadening the support statement, adding package-owned native dependencies, or claiming prebuild/custom-dev-client support.

## Non-blocking findings routed to PLRNUI-63

The final Node 24 evidence run also surfaced release-governance items that do not change the PLRNUI-62 native-runtime disposition:

- the canonical GitHub CI still uses Node 20 while package metadata requires Node `>=22.13.0`;
- `npm ci` reported one high-severity vulnerability for review;
- npm reported an install-script approval warning for `esbuild@0.28.1`;
- current test infrastructure emits `react-test-renderer` deprecation and experimental-loader warnings.

These require publication/release-governance assessment under PLRNUI-63 before the parent publication gate can authorize the RC.

## Final verdict

**PLRNUI-62: COMPLETE.**

**G9 / RA 0005: CLOSED for the selected `0.1.0-rc.1` support boundary by owner acceptance.**

**Overall RC publication: STILL BLOCKED pending PLRNUI-63 and final PLRNUI-61 authorization.**

No npm publish, tag, or GitHub Release is performed by this closure.
