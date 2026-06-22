# PLRNUI-7 - Native Dependency Register

## Scope

This register covers native or potentially native dependencies declared in `package.json`, plus native-adjacent packages inferred from lockfile peers and source imports.

Evidence sources:

- `package.json`
- `package-lock.json`
- `theme/ThemeProvider.tsx`
- `theme/themeStorage.ts`
- `storage/tokenStorage.native.ts`
- `utils/clipboard.ts`
- icon imports in `components/form/Checkbox.tsx`, `components/form/Select.tsx`, `components/typography/Code.tsx`, `components/navigation/SideBar.web.tsx`
- ADR 0005
- Risk Assessment 0005
- `audit/05-dependencies.md`
- `audit/components/platform-limitations.md`

## Native dependencies

| Package | Why native or potentially native | Requires autolinking | Expo Go compatibility | Managed workflow compatibility | Prebuild required | Config plugin required | Consumer risk | Required gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `react-native` | Host native runtime for all RN components. Imported across library source. | App-owned runtime, not library-owned autolinking. | Must match Expo SDK bundled RN. | Must match Expo/RN baseline. | App-specific. | No library config plugin. | Duplicate/incompatible RN if bundled. | Must be peer; PLRNUI-8 clean Expo/RN smoke. |
| `@react-native-async-storage/async-storage` | RN native storage module. Used by `theme/themeStorage.ts` and `storage/tokenStorage.native.ts`. Lockfile peers on `react-native`. | Yes, in native RN apps. | Unknown until PLRNUI-8 validates selected version against Expo SDK. | Likely compatible when SDK/version aligned, but must be tested. | Possible if not supported by Expo Go baseline. | Usually no custom plugin, but version support must be checked. | Clean consumer can fail with missing native module; core UI gets storage requirement indirectly. | Jira required; ADR if kept core; Risk Assessment if Expo Go behavior uncertain. |
| `expo-clipboard` | Optional Expo native/runtime integration for clipboard behavior. PLRNUI-39 classifies it as consumer-owned adapter implementation, not core package dependency. Lockfile/audit evidence shows peers on `expo`, `react`, `react-native` when used. | Consumer app owned; core package must not own autolinking. | Consumer must validate against selected Expo SDK if they choose the Expo adapter. | Compatible only when consumer installs an SDK-aligned version. | Consumer-owned if Expo Go does not support the selected module/version. | Consumer-owned; usually no custom plugin, but must be checked by the app. | A hard core dependency would make clipboard Expo-specific; adapter ownership keeps non-clipboard and non-Expo consumers unaffected. | PLRNUI-39 strategy; future adapter ticket required before official adapter/subpath. |
| `react-native-safe-area-context` | RN native safe-area module. Used by `ThemeProvider` default wrapper. Lockfile peers on `react` and `react-native`. | Yes. | Common in Expo, but selected version must be validated. | Compatible when aligned with Expo SDK. | Possible outside Expo Go or with unsupported version. | Usually no custom plugin, but must be verified. | `ThemeProvider` default makes native dep effectively required. | Jira required for policy change; ADR if provider contract changes. |
| `react-native-svg` | RN native SVG module. Declared directly and required as peer by `lucide-react-native`. | Yes. | Expo Go support/version must be validated. | Compatible when aligned with Expo SDK. | Possible if unsupported version or custom native setup needed. | Usually no custom plugin, but must be checked. | Icon components can fail at runtime if SVG is missing. | Jira required; Risk Assessment if version is not Expo Go compatible. |

## Potential native dependencies

| Package | Why potentially native | Requires autolinking | Expo Go compatibility | Managed workflow compatibility | Prebuild/dev client requirement | Config plugin requirement | Consumer risk | Required gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lucide-react-native` | JS icon wrapper that peers on `react-native-svg`; imports used in form/typography/navigation components. | Not itself, but depends on SVG native module. | Depends on `react-native-svg` support. | Depends on SVG version alignment. | Follows SVG requirement. | Follows SVG requirement. | Consumer may install icon package but miss SVG native peer. | Jira if introduced/changed; PLRNUI-8 icon render smoke. |
| `react-native-web` | Web runtime adapter, not native module, but host/platform dependency. | No. | Not applicable for native Expo Go; relevant to web target. | Expo web/managed web setup must be documented if supported. | No native prebuild. | No. | Native consumers should not be forced to install web runtime. | Jira if package web support is promoted. |
| `react-dom` | Web host renderer, not native module. | No. | Not applicable for native Expo Go. | Required only for web target. | No native prebuild. | No. | Native consumers should not receive hard web dependency. | Jira if web target is formal release requirement. |
| `expo` | Not declared, but peer of `expo-clipboard`. | Expo app runtime. | Determines Expo Go module availability. | Defines managed workflow baseline. | Prebuild needed for unsupported native modules. | May manage config plugins. | Hidden requirement if Expo modules are hard dependencies. | ADR required before making Expo hard dependency. |

## Native dependency detail

### `@react-native-async-storage/async-storage`

- Current declaration: `package.json` `dependencies`.
- Lockfile: `package-lock.json` package version `1.24.0`, peer `react-native`.
- Source imports: `theme/themeStorage.ts`, `storage/tokenStorage.native.ts`.
- API surface evidence: `storage` is root exported via `index.ts`; API audit classifies storage as not core UI API in `audit/04-api-surface.md` and `audit/api/export-matrix.md`.
- Expo Go: blocker until PLRNUI-8 validates a clean Expo app.
- Managed workflow: blocker until version is aligned with Expo SDK.
- Prebuild/dev client: required if the module/version is not available through Expo Go.
- Gate: Jira ticket required for keeping or changing this dependency; ADR required if storage remains part of core public API.

### `expo-clipboard`

- PLRNUI-39 classification: optional native/runtime integration owned by the consumer application.
- Package metadata policy: must not be declared in core package `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies`, or `devDependencies`.
- Import policy: must not be imported directly by the root package or root-reachable core runtime code.
- Adapter policy: Expo consumers may implement a future `ClipboardAdapter` using `expo-clipboard`.
- Current checkout note: `package.json` does not declare `expo-clipboard`; prior audit evidence recorded `utils/clipboard.ts` / `copyToClipboard` and lockfile peer implications.
- Expo Go: consumer-owned validation when the app chooses `expo-clipboard`.
- Managed workflow: consumer must use an Expo SDK-compatible version.
- Prebuild/dev client: consumer-owned if Expo Go does not include/support the needed module/version.
- Gate: future official Expo adapter or subpath requires a separate Jira ticket; ADR/Risk Assessment required if Expo becomes a hard package requirement.

### `react-native-safe-area-context`

- Current declaration: `package.json` `dependencies`.
- Lockfile: `package-lock.json` package version `5.6.2`, peers `react`, `react-native`.
- Source import: `theme/ThemeProvider.tsx`.
- API surface: `ThemeProvider` is root exported and default `withSafeArea = true`.
- Expo Go: likely common, but unverified for declared version.
- Managed workflow: must align with Expo SDK.
- Prebuild/dev client: possible if version unsupported.
- Gate: Jira ticket required for policy change; ADR if provider ownership/default behavior changes.

PLRNUI-37 final status:

- Contract decided: `react-native-safe-area-context` is a required peer under the current `ThemeProvider` behavior.
- Consumer owns native installation, autolinking/setup and Expo/RN version compatibility.
- The package must not hide this dependency as a bundled runtime dependency while the consumer owns the native runtime.
- The package must not mark this dependency optional in `peerDependenciesMeta` while `ThemeProvider` keeps safe-area behavior enabled by default.
- Clean consumer smoke must validate install, import and render with the selected Expo/RN baseline.

### `react-native-svg` and `lucide-react-native`

- Current declarations: both in `package.json` `dependencies`.
- Lockfile: `lucide-react-native` peers on `react`, `react-native`, and `react-native-svg`.
- Source imports: `Checkbox`, `Select`, `Code`, `SideBar.web`.
- Expo Go: depends on SVG version support.
- Managed workflow: must align with Expo SDK.
- Prebuild/dev client: possible when SVG native module is unsupported by Expo Go.
- Gate: Jira ticket required; PLRNUI-8 must include icon render smoke.

## Expo Go compatibility summary

| Package | Status |
| --- | --- |
| `react-native` | Blocker until matched to Expo SDK baseline. |
| `@react-native-async-storage/async-storage` | Unknown; requires PLRNUI-8 clean Expo validation. |
| `expo-clipboard` | Consumer-owned if clipboard adapter uses Expo; core package must not require it. |
| `react-native-safe-area-context` | Unknown for selected version; requires PLRNUI-8 validation. |
| `react-native-svg` | Unknown for selected version; requires PLRNUI-8 validation. |
| `lucide-react-native` | Depends on `react-native-svg`; requires icon smoke. |

## Managed workflow compatibility summary

Managed workflow compatibility is not proven by repository preview because `preview-web/vite.config.ts` and `tsconfig.preview.json` use aliases/shims for native modules. PLRNUI-8 must use a clean app without those local shims.

## Prebuild/dev client summary

Prebuild or custom dev client becomes required when:

- a native module is not included in Expo Go for the chosen SDK;
- a module version is incompatible with Expo Go;
- native configuration is required;
- a config plugin is needed;
- Metro cannot resolve the packaged dependency graph without local aliases.

## Consumer risk summary

| Risk | Evidence |
| --- | --- |
| Duplicate React Native | `react-native` in `dependencies`; ADR 0005 peer rule; `audit/05-dependencies.md` DEP-01 |
| Hidden native setup | Native modules in `dependencies`; Risk Assessment 0005 |
| Expo hard requirement | Prior audit evidence recorded `expo-clipboard` in `dependencies` and lockfile peer on `expo`; PLRNUI-39 forbids this as a core package requirement |
| Preview masks real install | `preview-web/vite.config.ts` shims native modules; `audit/06-build-and-packaging.md` BLD-06 |
| Public API forces native deps | `ThemeProvider` default safe-area, storage exports, clipboard utility exports |

PLRNUI-39 resolution for clipboard: `expo-clipboard` must not be a hard core requirement. Clipboard support must be optional and adapter-based, with any Expo implementation installed and validated by the consumer app.
