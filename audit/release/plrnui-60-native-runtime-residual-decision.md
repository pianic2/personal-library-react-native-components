# PLRNUI-60 — Native Runtime Residual Decision

## 1. Decision

Native runtime is accepted only as a residual for entering PLRNUI-41 hardening.
Native runtime remains blocking for RC artifact publication until validated or
explicitly owner-accepted at publication gate.

Recommended classification:

- Accepted for hardening entry.
- Blocking for RC artifact publication.
- Scheduled into PLRNUI-41 final hardening validation.

## 2. Scope

This decision covers RA 0005, the Expo/native dependency/native runtime residual
left by PLRNUI-12 and PLRNUI-59.

This is a governance/documentation decision only. It does not execute device
runtime validation, change package metadata, change runtime source, transition
Jira, publish Confluence or cut an RC artifact.

## 3. Current Evidence

Evidence read for this decision:

- `package.json`
- `audit/release/native-runtime-validation.md`
- `audit/release/consumer-smoke-validation-plrnui-46.md`
- `audit/release/expo-metro-consumer-validation-plrnui-58.md`
- `audit/release/plrnui-12-senior-rc-readiness-review.md`
- `audit/release/plrnui-59-mandatory-rc-governance-gates.md`
- `audit/risk-assessment/rc-risk-disposition-plrnui-59.md`

## 4. What Is Proven

- PROVEN: `package.json` has no `dependencies` section, so the current package
  declares no bundled runtime dependencies.
- PROVEN: `react` and `react-native` are peer dependencies in `package.json`.
- PROVEN: PLRNUI-46 packed-artifact consumer smoke passed for package root
  import, TypeScript declaration resolution and Node render smoke.
- PROVEN: PLRNUI-58 Expo/Metro web export passed from an external Expo fixture
  installed from the packed tarball.
- PROVEN: PLRNUI-12 senior review reproduced `typecheck`, `test`, `build`,
  `package:dry-run`, `consumer:smoke` and `consumer:expo` on Node v24.17.0.

## 5. What Is Not Proven

- NOT PROVEN: Expo Go on physical device.
- NOT PROVEN: native iOS runtime.
- NOT PROVEN: native Android runtime.
- NOT PROVEN: managed workflow device runtime.
- NOT PROVEN: prebuild.
- NOT PROVEN: custom dev client.
- NOT PROVEN: EAS build.
- NOT PROVEN: native runtime behavior for optional consumer-owned storage,
  clipboard, safe-area, SVG/icon or future native-adjacent integrations.

Expo web/Metro export is not native runtime validation. Browser preview shims
are not native runtime validation. Node render smoke is not native runtime
validation.

## 6. Residual Classification

RA 0005 remains:

```text
TRACKED CONDITION / ACCEPTED RESIDUAL FOR HARDENING ENTRY ONLY / BLOCKER FOR RC ARTIFACT PUBLICATION
```

RA 0005 is not `MITIGATED`.

## 7. Impact on PLRNUI-12

PLRNUI-12 can be reassessed for entry into PLRNUI-41 hardening because the
repository-side governance gates are now tracked and executable package gates
have passing evidence.

PLRNUI-12 should not be closed as full RC-ready solely from repository evidence
because native runtime remains NOT PROVEN for RC artifact publication.

## 8. Impact on PLRNUI-41

PLRNUI-41 may start with RA 0005 as an accepted residual for hardening entry.

PLRNUI-41 must include final hardening validation or an explicit owner decision
for:

- Expo Go on physical device.
- Native iOS runtime.
- Native Android runtime.
- Prebuild.
- Custom dev client.
- EAS build, if selected as the publication/build path.

## 9. Impact on RC Artifact Publication

RC artifact publication remains blocked until native runtime is validated or
explicitly owner-accepted at the publication gate.

`0.0.0` also remains non-publishable as an RC version. Version assignment is a
separate publication gate and is not changed by PLRNUI-60.

## 10. Required Validation Before RC Artifact

Before an RC artifact can be cut or published, the owner must choose and record
one of:

- Native runtime validation completed for the selected Expo/RN path.
- Native runtime residual explicitly accepted at publication gate with impact,
  scope and rollback/support implications.
- RC artifact remains blocked.

Minimum recommended validation:

- Install the packed artifact into a clean Expo/RN consumer.
- Run the consumer on native iOS or iOS simulator.
- Run the consumer on native Android or Android emulator.
- Validate Expo Go if it is claimed as supported.
- Validate prebuild/custom dev client if either is required by the selected
  native dependency strategy.
- Record `npm ls react react-native expo --depth=0` from the consumer.

## 11. Recommended Jira Comment

```text
PLRNUI-60 RA 0005 decision:

Native runtime is accepted only as a residual for entering PLRNUI-41 hardening.
Native runtime remains blocking for RC artifact publication until validated or
explicitly owner-accepted at publication gate.

Proven:
- package.json has no runtime dependencies and keeps React/RN as peers;
- PLRNUI-46 packed-artifact consumer smoke passed;
- PLRNUI-58 Expo/Metro web export passed;
- PLRNUI-12 reproduced executable package gates on Node v24.

NOT PROVEN:
- Expo Go on physical device;
- native iOS runtime;
- native Android runtime;
- prebuild;
- custom dev client;
- EAS build.

Recommendation: schedule native runtime validation into PLRNUI-41 final
hardening. Do not cut/publish RC artifact until this gate is validated or
explicitly owner-accepted at publication gate.
```
