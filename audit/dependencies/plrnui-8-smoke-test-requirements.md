# PLRNUI-7 - PLRNUI-8 Smoke Test Requirements

## Purpose

PLRNUI-8 must validate that the dependency policy defined by PLRNUI-7 works in real consumer environments.

Evidence basis:

- ADR 0005 requires a clean Expo app smoke test, Metro root import, TypeScript consumer visibility, no uncontrolled native dependencies, and documented peers.
- ADR 0006 requires typecheck, build, `npm pack --dry-run`, clean app install, root import, documented import tests, render smoke, and duplicate React/RN checks.
- Risk Assessment 0005 requires Expo Go/managed/prebuild validation for native dependencies.
- Risk Assessment 0006 marks package install failure as critical.

## What PLRNUI-8 must test

| Area | Required check | Evidence it addresses |
| --- | --- | --- |
| Package build | Library can build and emit declarations. | ADR 0006, `audit/06-build-and-packaging.md` |
| Package contents | `npm pack --dry-run` includes expected `dist` files and no missing entrypoints. | Risk Assessment 0006 |
| Clean install | Consumer app installs package artifact without local repo aliases. | ADR 0006 |
| Root import | Consumer imports from package root. | `index.ts`, `package.json` exports, API audit |
| TypeScript import | Consumer TypeScript sees declarations. | ADR 0006 |
| React/RN duplication | Consumer dependency tree does not contain duplicate incompatible React/RN. | ADR 0005/0006 |
| Native dependencies | Safe area, AsyncStorage, Expo Clipboard, SVG/icons are installed or documented as optional. | Risk Assessment 0005 |
| Expo Go | App runs or limitation is documented as release blocker/accepted limitation. | ADR 0005 |
| Managed workflow | App runs in clean managed workflow. | Risk Assessment 0005 |
| Prebuild/dev client | Need is detected and documented when native modules require it. | ADR 0005 |
| Web preview parity | Web support does not rely on hidden repo-only aliases for consumer claims. | `preview-web/vite.config.ts`, BLD-06 |

## Commands to execute

Commands are requirements for PLRNUI-8, not executed by PLRNUI-7.

From library repository:

```bash
npm install
npm run typecheck
npm run build
npm pack --dry-run
```

In clean Expo consumer app:

```bash
npx create-expo-app plrnui-smoke
cd plrnui-smoke
npm install ../path-to-packed-tarball.tgz
npm ls react react-native
npm ls @react-native-async-storage/async-storage expo-clipboard react-native-safe-area-context react-native-svg lucide-react-native
npx expo start
```

If prebuild validation is required:

```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

If web support is claimed:

```bash
npx expo start --web
```

Exact commands may be adjusted by PLRNUI-8 based on the final package artifact and environment, but equivalent evidence is required.

## Consumer scenarios

### Scenario 1 - Bare minimum root import

Goal: prove the package root resolves in a clean consumer.

Consumer code:

```tsx
import { Button, Text, ThemeProvider } from "@personal-library/react-native-components";
```

Required evidence:

- Metro resolves package root.
- TypeScript resolves exported declarations.
- No local path aliases are needed.
- No direct import from `src`, `dist`, or repo internals.

### Scenario 2 - Core component render

Goal: render stable/beta candidate components that exercise RN runtime only.

Minimum components:

- `ThemeProvider`
- `Button`
- `Text`
- `Box`
- `Input`
- `Checkbox`

Required evidence:

- App renders on native target.
- No missing native module errors.
- `Checkbox` exercises `lucide-react-native` and `react-native-svg`.

### Scenario 3 - ThemeProvider safe-area path

Goal: validate default provider behavior.

Required checks:

- `ThemeProvider` default `withSafeArea = true` works.
- `react-native-safe-area-context` resolves.
- If dependency is optional in final policy, app behavior without it must be documented or guarded.

Evidence: `theme/ThemeProvider.tsx` imports `SafeAreaProvider` and `SafeAreaView`.

### Scenario 4 - Storage path

Goal: validate or isolate AsyncStorage requirements.

Required checks:

- Theme mode persistence path does not crash.
- `storage/tokenStorage.native.ts` behavior is either smoke tested or excluded from root/public smoke if storage is removed from core policy.

Evidence: `theme/themeStorage.ts`, `storage/tokenStorage.native.ts`, `audit/04-api-surface.md`.

### Scenario 5 - Clipboard path

Goal: validate `expo-clipboard` optional/native behavior.

Required checks:

- `Code` or `copyToClipboard` scenario runs in Expo Go if supported.
- If unsupported, limitation is documented and release blocker is resolved by owner decision.

Evidence: `utils/clipboard.ts`, `components/typography/Code.tsx`.

### Scenario 6 - Web target, if claimed

Goal: validate RN Web support without hidden repository shims.

Required checks:

- Consumer web app uses documented setup only.
- `react-native-web`, `react-dom`, and `lucide-react` policy is explicit.
- Native shims from `preview-web/shims` are not assumed unless documented for consumers.

Evidence: `preview-web/vite.config.ts`, `tsconfig.preview.json`, `audit/06-build-and-packaging.md` BLD-06.

## Expo clean app scenario

Minimum acceptance:

- Clean Expo app installs the packed package.
- App imports the package root.
- App renders at least one component using:
  - `react-native`;
  - `ThemeProvider`;
  - `react-native-safe-area-context`;
  - an icon path through `lucide-react-native`/`react-native-svg`.
- App runs without local repo aliases.
- Dependency tree does not contain duplicate incompatible React or React Native.
- Native dependency behavior is recorded as Expo Go compatible, managed compatible, or requiring prebuild/dev client.

## Root import test

Required root import:

```tsx
import {
  ThemeProvider,
  Button,
  Text,
  Box,
  Checkbox,
  useTheme,
} from "@personal-library/react-native-components";
```

Failure conditions:

- TypeScript cannot find declarations.
- Metro cannot resolve `exports`.
- Consumer must import from `../../index`, `src`, `dist`, or internal folders.
- Consumer must add undocumented aliases equivalent to `preview-web/vite.config.ts`.

## Peer dependency install test

PLRNUI-8 must prove the final peer policy works.

Required checks:

- install with only required peers;
- install with optional native peers enabled;
- `npm ls react react-native` shows no duplicate incompatible host runtime;
- missing optional peers produce documented optional feature limitations, not package root crash;
- native peers required by default APIs are either installed or reclassified as required peers.

## Native/prebuild validation

For each native dependency:

| Package | Required validation |
| --- | --- |
| `react-native-safe-area-context` | `ThemeProvider` render with safe area enabled. |
| `@react-native-async-storage/async-storage` | Theme/storage path does not crash, or API is isolated/documented. |
| `expo-clipboard` | Clipboard path works in Expo Go, or limitation is documented. |
| `react-native-svg` | Icon render works. |
| `lucide-react-native` | Icon import/render works and SVG peer is installed. |

Prebuild/dev client validation is required if any of the above fails in Expo Go or if final dependency versions require native code not available in Expo Go.

## Release blocker rule

PLRNUI-8 smoke test is a blocker release gate.

Release must remain blocked if:

- clean install fails;
- root import fails;
- TypeScript declarations fail;
- Metro resolution fails;
- duplicate React/RN is detected;
- Expo Go compatibility is claimed but not proven;
- managed workflow compatibility is claimed but not proven;
- prebuild/dev client is required but not documented through Jira/ADR;
- native dependency missing errors occur;
- package only works with local preview aliases or shims.

Owner may accept a limitation only by documenting it with:

- Jira ticket;
- ADR if architectural/baseline changing;
- Risk Assessment when native/Expo workflow impact remains;
- release notes and install docs.
