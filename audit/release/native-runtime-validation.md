# PLRNUI-8 - Native Runtime Validation

## Scope

File-based validation of native dependency readiness for Expo Go, managed workflow, prebuild/custom dev client requirements, AsyncStorage, Safe Area and Clipboard strategy.

Runtime validation in Expo Go or Metro could not proceed because clean consumer installation failed.

Current-state note: this PLRNUI-8 report is historical evidence for the failed consumer validation run. PLRNUI-44 supersedes the package dependency classification for the current checkout: current `package.json` has no runtime `dependencies`, keeps `react` / `react-native` as peers, and keeps AsyncStorage / Clipboard consumer-owned.

Current-state note for PLRNUI-58: automated Expo/Metro web export now passes in a generated external Expo fixture installed from the packed package tarball. This proves Metro web bundling, but it does not prove Expo Go, native device runtime, prebuild or custom dev client behavior.

## Evidence

Inputs reviewed:

- `audit/dependencies/native-dependency-register.md`
- `audit/dependencies/expo-rn-workflow-risk-matrix.md`
- `audit/dependencies/native-dependency-gate.md`
- `audit/dependencies/plrnui-8-smoke-test-requirements.md`
- `package.json`
- `tsup.config.ts`
- `theme/ThemeProvider.tsx` evidence from dependency audit
- `theme/themeStorage.ts` evidence from dependency audit
- `storage/tokenStorage.native.ts` evidence from dependency audit
- `utils/clipboard.ts` evidence from dependency audit

Native or native-adjacent packages declared in the historical PLRNUI-8 package artifact:

| Package | Current package section | Native/runtime role |
| --- | --- | --- |
| `react-native` | Historical `dependencies` | Host native runtime; current package metadata keeps it as a peer. |
| `@react-native-async-storage/async-storage` | Historical `dependencies` | Native storage module; current PLRNUI-44 policy keeps it consumer-owned. |
| `expo-clipboard` | Historical `dependencies` | Expo native module; current PLRNUI-44 policy keeps it consumer-owned and excluded from core metadata. |
| `react-native-safe-area-context` | Historical `dependencies` | Native safe-area module; current policy is governed by PLRNUI-37. |
| `react-native-svg` | Historical `dependencies` | Native SVG module; not declared in current package metadata. |
| `lucide-react-native` | Historical `dependencies` | Native-adjacent icon wrapper; not declared in current package metadata. |
| `react-native-web` | Historical `dependencies` | Web runtime adapter; not declared in current package metadata. |
| `react-dom` | Historical `dependencies` | Web host runtime; not declared in current package metadata. |

Build external evidence:

- `tsup.config.ts` externalizes `react`, `react-native`, `react-native-safe-area-context`, `lucide-react-native`, and undeclared `expo-secure-store`.
- It does not externalize `@react-native-async-storage/async-storage`, `expo-clipboard`, `react-native-svg`, `react-dom`, or `react-native-web`.

Consumer smoke evidence:

- Clean Expo app creation succeeded under `/tmp/plrnui8-consumer`.
- Clean package install failed before runtime validation due React peer mismatch.

## Commands Executed

```bash
sed -n '1,300p' audit/dependencies/native-dependency-register.md
sed -n '1,300p' audit/dependencies/expo-rn-workflow-risk-matrix.md
sed -n '1,300p' audit/dependencies/native-dependency-gate.md
sed -n '1,300p' audit/dependencies/plrnui-8-smoke-test-requirements.md
rg -n "from ['\"](react|react-native|react-dom|react-native-web|@react-native-async-storage/async-storage|expo-clipboard|react-native-safe-area-context|react-native-svg|lucide-react-native|lucide-react)['\"]" components hooks storage theme themes tokens utils index.ts preview-web demo -g '*.ts' -g '*.tsx'
```

## Findings

- Expo web/Metro bundling is proven by PLRNUI-58 with `expo export --platform web`.
- Expo Go compatibility remains unknown because no device/runtime session is automated locally.
- Managed workflow device compatibility is unknown because PLRNUI-58 validates web export only.
- Prebuild/custom dev client requirement is unknown and must remain blocked until native dependencies are installed and run in a clean consumer.
- AsyncStorage strategy in current governance is consumer-owned and adapter-based; executable consumer validation remains deferred.
- Safe Area strategy remains governed by PLRNUI-37 and must be validated if/when package metadata exposes that contract.
- Clipboard strategy in current governance is consumer-owned and adapter-based; `expo-clipboard` is excluded from core package metadata.
- SVG/icon strategy is not declared in current package metadata; future introduction requires the native dependency gate.
- Preview web shims cannot be used as evidence for Expo Go or managed workflow compatibility.

## Risks

- Native dependencies can force prebuild or custom dev client if versions are not supported by the selected Expo SDK.
- Future native dependencies can make root package install fail or runtime crash if introduced without the PLRNUI-44 gate.
- Expo-specific clipboard would make the package effectively Expo-only if it were added to core metadata; PLRNUI-39 and PLRNUI-44 forbid that for the core package.
- Safe area and storage behavior are tied to root-reachable APIs, so optional peer treatment would require runtime guards or API isolation.
- Build externalization is not aligned with package dependency policy, increasing bundling and Metro resolution risk.

## Blockers

- PLRNUI-46 clean consumer package install/type/render smoke now passes for the packed artifact, but it does not execute native runtime paths.
- PLRNUI-58 Expo/Metro web export now passes for the packed artifact.
- Expo Go compatibility has not been proven.
- Managed workflow compatibility has not been proven.
- Prebuild/custom dev client requirement has not been proven or ruled out.
- Native dependency gate decisions are documented by PLRNUI-44 for the current package state; PLRNUI-58 adds executable Expo/Metro web export validation, while native device runtime validation remains separate.

## Conclusion

Native runtime readiness is only partially validated. Historical PLRNUI-8 evidence supports only a risk classification for that artifact. Current PLRNUI-44 package governance has no bundled native runtime dependency, PLRNUI-46 adds packed-artifact consumer install/type/render evidence, and PLRNUI-58 adds Expo/Metro web export evidence. Expo Go, native device runtime, prebuild and custom dev client behavior still remain unproven.
