# PLRNUI-7 - Dependency Classification

## Repository state

Evidence collected before creating this file:

| Item | State | Evidence |
| --- | --- | --- |
| Branch | `main` | `git branch --show-current` |
| Git status | Dirty before PLRNUI-7 edits | `git status --short` reported ` M package-lock.json` and `?? audit/` before `audit/dependencies/` was created. |
| Modified tracked files | `package-lock.json` | `git status --short`; this file was already modified before PLRNUI-7 documentation edits. |
| Untracked relevant files | `audit/` | `git status --short`; the audit tree was untracked before PLRNUI-7 documentation edits. |
| `audit/` presence | Present | `find audit -maxdepth 3 -type f -o -type d` |
| `audit/dependencies/` presence | Created for PLRNUI-7 | Required output folder for this ticket. |
| Declared input `audit/adr/0005-expo-react-native-compatibility-baseline.md` | Present | `audit/adr/0005-expo-react-native-compatibility-baseline.md` |
| Declared input `audit/adr/0006-build-packaging-and-release-strategy.md` | Present | `audit/adr/0006-build-packaging-and-release-strategy.md` |
| Declared input `audit/risk-assessment/0005-expo-native-dependency-risk.md` | Present | `audit/risk-assessment/0005-expo-native-dependency-risk.md` |
| Declared input `audit/risk-assessment/0006-packaging-and-consumer-installation-risk.md` | Present | `audit/risk-assessment/0006-packaging-and-consumer-installation-risk.md` |
| Declared input `audit/05-dependencies.md` | Present | `audit/05-dependencies.md` |

## Package sections detected

Evidence: `package.json`, root package object in `package-lock.json`.

| Section | Packages |
| --- | --- |
| `peerDependencies` | `react` |
| `dependencies` | `@react-native-async-storage/async-storage`, `expo-clipboard`, `lucide-react`, `lucide-react-native`, `react-dom`, `react-native`, `react-native-safe-area-context`, `react-native-svg`, `react-native-web`, `tsup`, `typescript`, `ui` |
| `devDependencies` | `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `vite` |
| `optionalDependencies` | None declared |
| `peerDependenciesMeta` | None declared |

Lockfile evidence: `package-lock.json` root package repeats the same `dependencies`, `devDependencies`, and `peerDependencies`.

## Dependency classification

Classification values used below:

- peer dependency candidate
- runtime dependency candidate
- dev/build/test dependency
- native dependency
- Expo-specific dependency
- React Native native module
- optional peer candidate
- dependency da vietare come runtime dependency
- dependency da verificare con PLRNUI-8 smoke test

| Package | Declared version | Current section | Proposed classification | Motivation | Evidence | Consumer impact | Expo Go impact | Managed workflow impact | Prebuild/dev client impact | Release risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `react` | `^19.2.4` | `peerDependencies` | peer dependency candidate; dependency da verificare con PLRNUI-8 smoke test | React is host runtime and must not be bundled by a reusable RN library. Current placement is aligned with ADR 0005. | `package.json` `peerDependencies`; many imports from `react`; ADR 0005 says React host deps should be peers; ADR 0006 requires no duplicate React. | Consumer must provide compatible React. | Compatible if Expo SDK supports the installed React version; must be checked in clean app. | Compatible when version is aligned with Expo/RN pair. | No native requirement. | High if version range is incompatible with Expo/RN baseline. |
| `react-native` | `^0.84.0` | `dependencies` | peer dependency candidate; React Native native module; dependency da vietare come runtime dependency; dependency da verificare con PLRNUI-8 smoke test | RN is the host runtime and is imported by most components. Bundling it as a dependency can duplicate RN in consumers. | `package.json` `dependencies`; imports in `components/**`, `hooks/useBreakpoint.ts`, `theme/ThemeProvider.tsx`, `theme/themeStorage.ts`; ADR 0005 host deps peer rule; `audit/05-dependencies.md` DEP-01. | Consumer must own RN version. Moving from dependency to peer is a candidate breaking change. | Expo Go only works with the RN version bundled by the Expo SDK. | Managed workflow requires Expo-compatible RN. | RN is the native runtime; prebuild/dev client depends on consumer app. | Critical until peer policy and smoke app are verified. |
| `react-dom` | `^19.2.4` | `dependencies` | optional peer candidate; dev/build/test dependency for preview; dependency da vietare come runtime dependency; dependency da verificare con PLRNUI-8 smoke test | Used for web preview/RN Web pairing, not imported by library source directly. `react-native-web` peers on it. | `package.json` `dependencies`; `preview-web/tsconfig.json` types; `react-native-web` peer in `package-lock.json`; `audit/05-dependencies.md`. | Native-only consumers should not install it as required runtime. Web consumers must provide it. | No direct Expo Go effect. | No direct managed native effect. | No native requirement. | Medium; can inflate native consumers and create React DOM version constraints. |
| `react-native-web` | `^0.21.2` | `dependencies` | optional peer candidate; dev/build/test dependency for preview; dependency da vietare come runtime dependency; dependency da verificare con PLRNUI-8 smoke test | Required by preview web aliasing, but not a hard native runtime. Web consumers should opt in. | `package.json` `dependencies`; `preview-web/vite.config.ts` aliases `react-native` to `react-native-web`; `package-lock.json` peer requires `react` and `react-dom`; `audit/06-build-and-packaging.md` BLD-06. | Native consumers should not be forced to install RN Web. Web consumers need documented setup. | No direct Expo Go effect unless web target is used. | Managed web target needs explicit setup. | No native requirement. | Medium; preview shims may hide consumer setup gaps. |
| `@react-native-async-storage/async-storage` | `^1.23.1` | `dependencies` | optional peer candidate; native dependency; React Native native module; dependency da verificare con PLRNUI-8 smoke test | Used by theme persistence and native token storage. It is a native RN module with a `react-native` peer. | `theme/themeStorage.ts`; `storage/tokenStorage.native.ts`; `package-lock.json` peer on `react-native`; `audit/05-dependencies.md` DEP-05; `audit/theme/theme-provider-responsibility.md`. | Consumers need native module installed if they use provider persistence/storage APIs. Core UI consumers may not expect auth/theme storage dependency. | May be compatible only when the Expo SDK includes or supports the package version; requires smoke validation. | Usually autolinked in managed/prebuild flows, but package/version must match Expo. | May require prebuild/dev client if not supported by Expo Go baseline. | High; native storage as implicit core dependency can break clean consumers. |
| `expo-clipboard` | `^8.0.8` in prior audit evidence; not declared in current checkout `package.json` | Historical audit evidence: `dependencies`; current package metadata: absent | optional native/runtime integration; consumer-owned adapter implementation; not a root peer dependency; dependency da vietare come core runtime dependency | PLRNUI-39 decides clipboard support must be adapter-based. The core package must not import or bundle `expo-clipboard`; Expo consumers may use it as their adapter backend. | PLRNUI-39; `audit/dependencies/clipboard-dependency-strategy.md`; `package-lock.json` peer evidence from prior audit; `audit/05-dependencies.md` DEP-06; ADR 0005 says Expo deps should be documented/isolated. | Non-clipboard consumers have no install requirement. Expo consumers that opt into clipboard own install/configuration. | Consumer validates module availability in Expo Go when choosing the Expo adapter. | Consumer installs an SDK-compatible version when choosing the Expo adapter. | Consumer-owned if native module is not supported by Expo Go baseline. | Low/medium if additive and opt-in; high only if core imports or requires it. |
| `react-native-safe-area-context` | `^5.6.2` | `dependencies` | peer dependency candidate or optional peer candidate; native dependency; React Native native module; dependency da verificare con PLRNUI-8 smoke test | Used by `ThemeProvider` by default through `SafeAreaProvider` and `SafeAreaView`. It is a native module but common in Expo/RN apps. | `theme/ThemeProvider.tsx`; `package-lock.json` peer on `react` and `react-native`; `audit/05-dependencies.md`; `audit/theme/theme-provider-responsibility.md`. | Consumers using `ThemeProvider` default safe-area behavior must install it. If provider remains core, peer may be required. | Commonly supported in Expo Go, but version must be smoke tested. | Managed workflow expects Expo-compatible version. | Autolinking/native setup may be required outside Expo Go. | High; provider default makes dependency effectively hard. |
| `react-native-svg` | `^15.15.3` | `dependencies` | optional peer candidate; native dependency; React Native native module; dependency da verificare con PLRNUI-8 smoke test | Not imported directly by source, but required as peer by `lucide-react-native`. | `package.json`; `package-lock.json` `lucide-react-native` peer on `react-native-svg`; `audit/05-dependencies.md` DEP-01/DEP-04. | Icon consumers need SVG installed; non-icon consumers should not necessarily receive it as bundled runtime. | Must verify Expo Go support/version. | Managed workflow requires compatible native module. | May require prebuild/dev client if not Expo Go compatible. | High because it is native and transitively required by icon package. |
| `lucide-react-native` | `^0.574.0` | `dependencies` | optional peer candidate; React Native native module consumer; dependency da verificare con PLRNUI-8 smoke test | Used for icons in components and peers on `react-native-svg`, making it native-adjacent. | Imports in `components/form/Checkbox.tsx`, `components/form/Select.tsx`, `components/typography/Code.tsx`, `components/navigation/SideBar.web.tsx`; `package-lock.json` peer on RN and SVG. | Consumers rendering icon-bearing components need icon and SVG peers. | Depends on SVG compatibility in Expo Go. | Managed workflow depends on SVG support. | Prebuild/dev client risk follows `react-native-svg`. | High for components with icons; medium for consumers avoiding those components. |
| `lucide-react` | `^0.574.0` | `dependencies` | optional peer candidate for web; dev/build/test dependency for preview | Used by preview aliases to replace `lucide-react-native` on web. Library source does not import it directly. | `tsconfig.ui.json` path maps `lucide-react-native` to `node_modules/lucide-react`; `preview-web/vite.config.ts` alias; `audit/05-dependencies.md`. | Native consumers should not need this package. Web consumers may need it if web alias strategy is documented. | No direct Expo Go effect. | No direct managed native effect. | No native requirement. | Medium; web preview dependency is mixed into runtime deps. |
| `tsup` | `^8.5.1` | `dependencies` | dev/build/test dependency; dependency da vietare come runtime dependency | Build tool imported only by `tsup.config.ts`. It is not runtime library code. | `package.json` `dependencies`; `tsup.config.ts`; `audit/05-dependencies.md` DEP-02. | Consumer installs unnecessary build tool if kept as dependency. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Medium; bloats install and mixes build/runtime responsibilities. |
| `typescript` | `^5.9.3` | `dependencies` | dev/build/test dependency; dependency da vietare come runtime dependency | TypeScript is used for build/typecheck/declaration output, not runtime. | `package.json` scripts; `tsconfig*.json`; `tsup` optional peer in `package-lock.json`; `audit/05-dependencies.md` DEP-02. | Consumer should not receive TS compiler as runtime dependency. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Medium; packaging hygiene issue. |
| `ui` | `^0.2.4` | `dependencies` | dependency da vietare come runtime dependency pending proof; dependency da verificare with follow-up | No static imports found in audited source. `audit/05-dependencies.md` flags it as unused/opaque. | `package.json`; `package-lock.json` package `ui`; `audit/05-dependencies.md` DEP-03; source import search found no imports. | Consumer receives opaque package with unclear purpose. | Unknown; no evidence it is needed for Expo Go. | Unknown. | Unknown. | High until ownership/purpose is explained or removed in a separate ticket. |
| `@types/react` | `^19.2.14` | `devDependencies` | dev/build/test dependency | Type declarations for TypeScript development. | `package.json` `devDependencies`; `tsconfig.ui.json` `types`; `react-native` optional peer on `@types/react` in `package-lock.json`. | No runtime consumer impact if kept dev-only. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Low. |
| `@types/react-dom` | `^19.2.3` | `devDependencies` | dev/build/test dependency | Type declarations for web preview. | `package.json` `devDependencies`; `preview-web/tsconfig.json` types. | No runtime consumer impact if kept dev-only. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Low. |
| `@vitejs/plugin-react` | `^5.1.4` | `devDependencies` | dev/build/test dependency | Vite preview plugin. | `package.json` `devDependencies`; `preview-web/vite.config.ts`. | No runtime consumer impact if kept dev-only. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Low. |
| `vite` | `^7.3.1` | `devDependencies` | dev/build/test dependency | Preview web server/build tool. | `package.json` scripts `preview`; `preview-web/vite.config.ts`; `audit/06-build-and-packaging.md`. | No runtime consumer impact if kept dev-only. | No direct Expo Go effect. | No direct managed effect. | No native requirement. | Low. |

## Main findings

### DEP7-01 - React Native is a runtime dependency, but policy requires peer ownership

- Evidence: `package.json` puts `react-native` in `dependencies`; source imports `react-native` across `components/**`, `hooks/**`, `theme/**`, `utils/**`; ADR 0005 says React and React Native host dependencies should be peers.
- Impact: consumer apps can receive duplicate or incompatible React Native installations.
- Risk: Critical for release.

### DEP7-02 - Expo-specific clipboard must not be a hard runtime dependency

- Evidence: prior audit state recorded `expo-clipboard` in `dependencies`, dynamic clipboard import evidence, and lockfile peers on `expo`, `react`, and `react-native`; current checkout `package.json` does not declare it.
- PLRNUI-39 decision: do not add `expo-clipboard` as a core runtime dependency or root peer dependency. Clipboard must be optional and adapter-based.
- Impact: consumer-owned adapter keeps non-clipboard and non-Expo consumers free from Expo Clipboard installation requirements.
- Risk: Low/medium if implemented later as additive opt-in; high if a future change makes Expo Clipboard a core import or dependency.

### DEP7-03 - Native modules must not be mixed into runtime dependencies without policy

- Evidence: prior dependency audit state recorded native/native-adjacent packages such as `@react-native-async-storage/async-storage`, `react-native-safe-area-context`, `react-native-svg`, `lucide-react-native`, and `expo-clipboard` in `dependencies`; ADR 0005 and Risk Assessment 0005 require native dependency control.
- Impact: consumers may need native setup, autolinking, Expo SDK alignment, or prebuild without a documented gate.
- Risk: High.

### DEP7-04 - Build/dev tools are in `dependencies`

- Evidence: `tsup` and `typescript` are in `package.json` `dependencies`; `tsup.config.ts` imports `tsup`; `tsconfig*.json` use TypeScript settings; `audit/05-dependencies.md` DEP-02.
- Impact: consumer installs include build tools as runtime deps.
- Risk: Medium.

### DEP7-05 - Build externals and package dependencies are misaligned

- Evidence: `tsup.config.ts` externalizes `react`, `react-native`, `react-native-safe-area-context`, `lucide-react-native`, and undeclared `expo-secure-store`; it does not externalize `@react-native-async-storage/async-storage`, `expo-clipboard`, `react-native-svg`, `react-dom`, or `react-native-web`; `audit/05-dependencies.md` DEP-04 and `audit/06-build-and-packaging.md` BLD-03.
- Impact: native/host dependencies may be bundled or resolved inconsistently.
- Risk: High.

## Blockers

| Blocker | Evidence | Required before release |
| --- | --- | --- |
| React Native dependency policy unresolved | `package.json`; ADR 0005; `audit/05-dependencies.md` DEP-01 | Decide and implement peer/optional peer policy in a separate code/package ticket. |
| Native dependency gate missing | Risk Assessment 0005; ADR 0005 | Approve the gate in `native-dependency-gate.md` and apply it to future deps. |
| PLRNUI-8 smoke test missing | ADR 0005 verification; ADR 0006 release checklist; Risk Assessment 0006 | Treat Expo/RN smoke test as release blocker. |
| Expo Go/managed/prebuild compatibility unverified | `audit/risk-assessment/0005-expo-native-dependency-risk.md`; preview shims in `preview-web/vite.config.ts` | Run clean consumer validation in PLRNUI-8. |

## Open questions

- Should `ThemeProvider` keep `react-native-safe-area-context` as a required peer, or should safe-area support become opt-in?
- PLRNUI-39 answers clipboard strategy: adapter-based, consumer-owned, and not a root peer/runtime dependency of the core package.
- Should icon-bearing components require `lucide-react-native` and `react-native-svg` as peers, or should icons be injected by consumers?
- Is `ui` intentionally required, or is it stale/erroneous package metadata?
- Which Expo SDK and React Native version pair is the supported release baseline?
