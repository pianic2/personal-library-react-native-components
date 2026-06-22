# PLRNUI-7 - Peer Dependency Policy

## Evidence base

- `package.json` currently declares `react` and `react-native` as peer dependencies.
- Current package metadata keeps only `typescript` in `devDependencies`.
- ADR 0005 says React and React Native host dependencies should be modeled as peers, native dependencies must be controlled, and Expo-specific dependencies must be documented/isolated.
- ADR 0006 requires peer dependencies to be coherent and duplicate React/RN to be avoided before release.
- Risk Assessment 0005 flags native dependency governance and Expo Go/prebuild risk.
- Risk Assessment 0006 flags packaging and consumer install risk.
- `audit/05-dependencies.md` already records DEP-01 through DEP-06.
- `audit/migration/breaking-change-register.md` includes BC-010 for dependency policy and BC-011 for native dependency requirements.

## Latest stable Expo baseline

PLRNUI-42 aligns React peer compatibility to the latest stable Expo SDK baseline selected for this repository:

- Expo SDK: `56.0.0`
- React Native: `0.85`
- React: `19.2.3`
- Minimum Node: `22.13.x`

The Expo SDK stable baseline is the source of truth for Expo/React Native compatibility. Beta, canary, RC and preview baselines are out of scope for this policy.

## Policy: React

`react` must be a `peerDependency`.

Rationale:

- React is the host renderer runtime for both RN and web consumers.
- The package imports React throughout component/provider/hook code.
- ADR 0005 and ADR 0006 require avoiding duplicate React.

Proposed package policy:

```json
{
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0"
  }
}
```

This range is aligned by PLRNUI-42 to Expo SDK `56.0.0`, React Native `0.85` and React `19.2.3`. It keeps React 19 compatibility open within the current major while preventing React 20 from being accepted without a new baseline decision.

## Policy: React Native

`react-native` must not be bundled as a runtime dependency of the library. It should be a `peerDependency`.

Rationale:

- Source imports `react-native` across `components/**`, `hooks/**`, `theme/**`, and `utils/**`.
- ADR 0005 says React Native is the runtime target and host dependencies should be peers.
- `audit/05-dependencies.md` DEP-01 and `audit/07-risks.md` RSK-05 flag the current placement as high risk.

Proposed package policy:

```json
{
  "peerDependencies": {
    "react-native": ">=0.85.0 <0.86.0"
  }
}
```

The React Native peer range is not changed by PLRNUI-42. React Native peer alignment is tracked separately by PLRNUI-43.

## Policy: Expo

`expo` should not become a hard dependency unless the package owner explicitly decides the library is Expo-only.

Current evidence:

- `expo` is not declared in `package.json`.
- Prior audit evidence recorded `expo-clipboard` in `dependencies`.
- Prior audit evidence recorded `expo-clipboard` peers on `expo`, `react`, and `react-native`.
- Current checkout `package.json` does not declare `expo-clipboard`.
- ADR 0005 says Expo is the primary compatibility baseline, but React Native is the runtime target.

Policy:

- Expo-specific packages should be isolated behind optional APIs or consumer-provided adapters.
- A dependency on `expo` itself should be avoided for the core package.
- Any Expo module added to runtime requires a Jira ticket and may require ADR/Risk Assessment depending on impact.

PLRNUI-39 decision:

- `expo-clipboard` must not become a root `peerDependency` of the core package.
- `expo-clipboard` must not be added to root `peerDependenciesMeta` for the core package.
- Clipboard support must be adapter-based and owned by the consumer application.
- Expo consumers may use `expo-clipboard` only as their implementation of a `ClipboardAdapter`.
- An official Expo adapter requires a separate future ticket and must not be introduced by the core package policy.

## Policy: Expo modules

Expo modules must be classified before introduction:

| Class | Policy | Evidence requirement |
| --- | --- | --- |
| Core required Expo module | Avoid unless product decision makes package Expo-only | ADR or owner approval |
| Optional feature module | Optional peer candidate | API path, fallback behavior, docs, PLRNUI-8 smoke |
| Preview/demo-only Expo module | Dev dependency only | Must not be required by package root import |

Current Expo-specific package:

| Package | Current section | Proposed policy | Evidence |
| --- | --- | --- | --- |
| `expo-clipboard` | Historical audit evidence: `dependencies`; current checkout package metadata does not declare it | Consumer-owned adapter implementation; not a root peer of the core package | PLRNUI-39; `audit/dependencies/clipboard-dependency-strategy.md`; `package-lock.json` peers in prior audit evidence; `audit/05-dependencies.md` DEP-06 |

## Policy: React Native native modules

Native modules must not be introduced silently as hard runtime dependencies.

Policy:

- Required native modules must be documented as peers.
- Feature-specific native modules should be optional peers where possible.
- Every new native dependency requires a Jira ticket.
- ADR required when the dependency changes the package baseline, forces Expo/prebuild behavior, affects public API, or creates a likely breaking change.
- Risk Assessment required for Expo Go uncertainty, managed workflow impact, native config, or consumer install risk.

Current native/native-adjacent packages:

| Package | Proposed policy | Evidence |
| --- | --- | --- |
| `react-native-safe-area-context` | Peer if `ThemeProvider` keeps default safe-area behavior; optional peer if safe-area becomes opt-in | `theme/ThemeProvider.tsx`; `audit/theme/theme-provider-responsibility.md` |
| `@react-native-async-storage/async-storage` | Optional peer or move behind storage adapter | `theme/themeStorage.ts`; `storage/tokenStorage.native.ts`; `audit/05-dependencies.md` DEP-05 |
| `react-native-svg` | Optional peer tied to icon usage | `lucide-react-native` peer in `package-lock.json` |
| `lucide-react-native` | Optional peer or dependency only if icons are part of core contract | component imports; `package-lock.json` peers |
| `expo-clipboard` | Not a core peer; optional consumer-owned adapter implementation | PLRNUI-39; `audit/dependencies/clipboard-dependency-strategy.md`; `package-lock.json` peers |

### PLRNUI-37 - Safe Area provider dependency contract

`react-native-safe-area-context` is a required peer dependency while `ThemeProvider` keeps safe-area behavior enabled by default.

Policy:

- Keep `react-native-safe-area-context` in `peerDependencies`.
- Do not place `react-native-safe-area-context` in `dependencies`.
- Do not mark `react-native-safe-area-context` optional in `peerDependenciesMeta` under the current `ThemeProvider` contract.
- Reconsider optional peer status only in a future task if `ThemeProvider` changes contract, safe-area behavior becomes opt-in, or safe-area ownership moves to a separate provider/app-shell component.

Rationale: `ThemeProvider` safe-area behavior is part of the public/runtime provider contract. A required peer keeps native runtime ownership with the consumer app while making the dependency explicit.

### PLRNUI-39 - Clipboard dependency strategy

`expo-clipboard` is not a peer dependency of the core package.

Policy:

- Keep `expo-clipboard` out of root `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies`, and `devDependencies`.
- Do not import `expo-clipboard` directly from the package root or root-reachable core runtime code.
- Model clipboard support as an optional `ClipboardAdapter` contract when implemented.
- Document `expo-clipboard` only as one possible Expo consumer implementation.
- Reconsider an official Expo adapter only in a separate future ticket, and keep it separated from the core package contract.

Rationale: clipboard is a feature-specific native/runtime integration. A root peer dependency would make all consumers see an Expo-specific requirement even when they do not use clipboard behavior.

## Policy: JS-only dependencies

JS-only dependencies may remain in `dependencies` only when:

- they are imported by published runtime code;
- they are not host runtimes owned by the consumer;
- they do not pull native modules;
- they do not belong only to preview/build/test tooling.

Current finding:

- No declared runtime dependency is clearly proven to be a JS-only core runtime dependency.
- `ui` has no static imports in audited source and should not remain runtime without proof.

## Policy: build/test/docs dependencies

Build, test, docs and preview dependencies must stay in `devDependencies`.

Current evidence:

| Package | Current section | Proposed section | Evidence |
| --- | --- | --- | --- |
| `tsup` | `dependencies` | `devDependencies` | `tsup.config.ts`; `package.json` scripts; `audit/05-dependencies.md` DEP-02 |
| `typescript` | `dependencies` | `devDependencies` | `tsconfig*.json`; `package.json` scripts; `audit/05-dependencies.md` DEP-02 |
| `vite` | `devDependencies` | `devDependencies` | `preview-web/vite.config.ts`; `package.json` `preview` script |
| `@vitejs/plugin-react` | `devDependencies` | `devDependencies` | `preview-web/vite.config.ts` |
| `@types/react` | `devDependencies` | `devDependencies` | `tsconfig.ui.json`; `preview-web/tsconfig.json` |
| `@types/react-dom` | `devDependencies` | `devDependencies` | `preview-web/tsconfig.json` |
| `lucide-react` | `dependencies` | `devDependency` or optional web peer | `tsconfig.ui.json` and `preview-web/vite.config.ts` alias `lucide-react-native` to `lucide-react` |
| `react-dom` | `dependencies` | optional web peer/devDependency | `react-native-web` peer in lockfile; preview web TS config |
| `react-native-web` | `dependencies` | optional web peer/devDependency | `preview-web/vite.config.ts` |

## Proposed peerDependencies

Candidate proposal, not applied in PLRNUI-7:

```json
{
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0",
    "react-native": ">=0.85.0 <0.86.0",
    "react-native-safe-area-context": "^5.6.2",
    "lucide-react-native": "^0.574.0",
    "react-native-svg": "^15.15.3",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "react-dom": "^19.2.4",
    "react-native-web": "^0.21.2"
  }
}
```

Owner decision required:

- Keep only required core dependencies in `peerDependencies`.
- Move feature-specific packages to optional peers through `peerDependenciesMeta`.
- Decide if web packages belong to the core package or only to docs/preview.

## Proposed peerDependenciesMeta

Candidate proposal, not applied in PLRNUI-7:

```json
{
  "peerDependenciesMeta": {
    "@react-native-async-storage/async-storage": {
      "optional": true
    },
    "lucide-react-native": {
      "optional": true
    },
    "react-native-svg": {
      "optional": true
    },
    "react-dom": {
      "optional": true
    },
    "react-native-web": {
      "optional": true
    }
  }
}
```

Open policy decision:

- `react-native-safe-area-context` is optional only if safe-area behavior becomes opt-in or isolated from the core provider. Current `ThemeProvider` default makes it effectively required.

## What should remain in dependencies

At the current audit state, no declared package is clearly proven as a required JS-only runtime dependency for all consumers.

Any future `dependencies` entry must have:

- source import evidence from published runtime code;
- reason it is not a host runtime;
- evidence it is JS-only or native impact has passed the gate;
- PLRNUI-8 consumer smoke coverage if it affects app resolution.

## What should remain in devDependencies

These are conceptually dev/build/test/docs dependencies:

- `tsup`
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`
- preview-only web shims and tooling
- potentially `lucide-react`, `react-dom`, `react-native-web` if used only by preview/docs and not supported package web runtime

## What must not become runtime dependency

| Package | Reason | Evidence |
| --- | --- | --- |
| `react` | Host runtime; duplicate React risk | ADR 0005, ADR 0006, `package.json` current peer |
| `react-native` | Host native runtime; duplicate RN risk | ADR 0005, `audit/05-dependencies.md` DEP-01 |
| `react-dom` | Web host runtime | `react-native-web` peer in `package-lock.json`; preview-only usage |
| `react-native-web` | Web host/runtime adapter | `preview-web/vite.config.ts`; `audit/06-build-and-packaging.md` |
| `expo-clipboard` | Expo native/runtime module; PLRNUI-39 assigns ownership to consumer adapter, not core package metadata | `audit/dependencies/clipboard-dependency-strategy.md`; `package-lock.json` peers in prior audit evidence |
| `tsup` | Build tool | `tsup.config.ts` |
| `typescript` | Compiler/type tool | `tsconfig*.json` |
| `ui` | No source import evidence | `audit/05-dependencies.md` DEP-03; import search |

## Breaking change impact

Changing dependency placement is a candidate breaking change.

Evidence:

- `audit/migration/breaking-change-register.md` BC-010: dependency policy can require consumers to install peers explicitly.
- `audit/migration/breaking-change-register.md` BC-011: native dependency requirements can change Expo Go/prebuild setup.
- ADR 0006 requires install/import verification in a clean consumer before release.

Required release note topics:

- Required peers and optional peers.
- Expo SDK / RN baseline.
- Native module setup notes.
- Expo Go limitations.
- Managed workflow and prebuild/dev client notes.
- Migration from bundled dependencies to explicit consumer installs.
