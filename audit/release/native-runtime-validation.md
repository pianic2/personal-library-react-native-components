# PLRNUI-8 - Native Runtime Validation

## Scope

File-based validation of native dependency readiness for Expo Go, managed workflow, prebuild/custom dev client requirements, AsyncStorage, Safe Area and Clipboard strategy.

Runtime validation in Expo Go or Metro could not proceed because clean consumer installation failed.

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

Native or native-adjacent packages currently declared:

| Package | Current package section | Native/runtime role |
| --- | --- | --- |
| `react-native` | `dependencies` | Host native runtime; should be app-owned. |
| `@react-native-async-storage/async-storage` | `dependencies` | Native storage module used by theme/storage paths. |
| `expo-clipboard` | `dependencies` | Expo native module used by clipboard utility path. |
| `react-native-safe-area-context` | `dependencies` | Native safe-area module used by default `ThemeProvider`. |
| `react-native-svg` | `dependencies` | Native SVG module required by icon path. |
| `lucide-react-native` | `dependencies` | Native-adjacent icon wrapper relying on SVG. |
| `react-native-web` | `dependencies` | Web runtime adapter, not native, but consumer platform dependency. |
| `react-dom` | `dependencies` | Web host runtime, not native, but consumer platform dependency. |

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

- Expo Go compatibility is unknown for the selected package dependency set because the clean consumer cannot install the package.
- Managed workflow compatibility is unknown for the same reason.
- Prebuild/custom dev client requirement is unknown and must remain blocked until native dependencies are installed and run in a clean consumer.
- AsyncStorage strategy is not release-ready: AsyncStorage is a hard dependency and is used by theme/storage paths.
- Safe Area strategy is not release-ready: `ThemeProvider` default behavior makes `react-native-safe-area-context` effectively required.
- Clipboard strategy is not release-ready: `expo-clipboard` makes clipboard behavior Expo-specific while the package is not explicitly Expo-only.
- SVG/icon strategy is not release-ready: icon components depend on `lucide-react-native` and `react-native-svg`, with SVG native compatibility still unverified.
- Preview web shims cannot be used as evidence for Expo Go or managed workflow compatibility.

## Risks

- Native dependencies can force prebuild or custom dev client if versions are not supported by the selected Expo SDK.
- Hard native dependencies can make root package install fail or runtime crash for consumers that do not use the related feature.
- Expo-specific clipboard can make the package effectively Expo-only unless isolated or documented.
- Safe area and storage behavior are tied to root-reachable APIs, so optional peer treatment would require runtime guards or API isolation.
- Build externalization is not aligned with package dependency policy, increasing bundling and Metro resolution risk.

## Blockers

- Clean consumer install failure blocks all native runtime validation.
- Expo Go compatibility has not been proven.
- Managed workflow compatibility has not been proven.
- Prebuild/custom dev client requirement has not been proven or ruled out.
- Native dependency gate decisions are not implemented in package metadata.

## Conclusion

Native runtime readiness is not validated. Current evidence supports only a risk classification: the package has multiple hard native or native-adjacent dependencies, and the clean Expo consumer cannot install the package far enough to run Metro or Expo Go checks.
