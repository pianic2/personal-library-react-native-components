# PLRNUI-7 - Expo/RN Workflow Risk Matrix

## Evidence base

- ADR 0005 defines Expo as primary compatibility baseline and React Native as runtime target.
- ADR 0006 requires package smoke tests, clean consumer install, Metro compatibility, no duplicate React/RN, and peer dependency coherence.
- Risk Assessment 0005 says ungoverned native dependencies can break Expo Go, managed workflow, Metro, or consumer installs.
- Risk Assessment 0006 rates packaging/consumer installation risk as critical.
- `preview-web/vite.config.ts` and `tsconfig.preview.json` use local aliases/shims for `react-native`, `react-native-safe-area-context`, `@react-native-async-storage/async-storage`, `expo-clipboard`, and `lucide-react-native`.
- `package.json` currently declares native/runtime/web/build packages in `dependencies`.
- `audit/06-build-and-packaging.md` flags package export, externalization, and preview shim risks.

## Workflow matrix

| Area | Expo Go | Expo managed workflow | Prebuild | Custom dev client | Bare React Native |
| --- | --- | --- | --- | --- | --- |
| `react` / `react-native` host runtime | Must match Expo SDK pair. Duplicate RN is a blocker. | Must use Expo-supported RN version. | Native project generated from Expo baseline. | Same as managed/prebuild, plus custom native modules. | App owns RN version; peer range must not force duplicate. |
| `expo-clipboard` | Supported only if Expo Go includes compatible module/version. Unknown until PLRNUI-8. | Compatible when package version aligns with SDK. | Needed if unsupported in Expo Go or native changes are required. | Required if app needs module outside Expo Go support. | Not generally appropriate as hard dependency for non-Expo RN. |
| `@react-native-async-storage/async-storage` | Unknown until PLRNUI-8 validates module/version. | Usually managed via Expo-compatible dependency, but must be tested. | Required if unsupported by Expo Go baseline. | Required if custom native module set differs from Expo Go. | Consumer must install/autolink native module. |
| `react-native-safe-area-context` | Common but version must be validated. | Managed-compatible when SDK-aligned. | Possible if version unsupported. | Possible if custom runtime needed. | Consumer must install/autolink native module. |
| `react-native-svg` / `lucide-react-native` | SVG compatibility must be validated with icon render. | Managed-compatible only when SDK-aligned. | Possible if SVG version unsupported. | Possible for custom SVG/native requirements. | Consumer must install/autolink SVG. |
| `react-native-web` / `react-dom` | Not applicable to native Expo Go. | Relevant to Expo web only if package supports web. | No native effect. | No native effect. | Web-only consumers need explicit docs; native bare does not. |
| Preview shims | Not evidence of Expo Go compatibility. | Not evidence of managed compatibility. | Not evidence of prebuild compatibility. | Not evidence of dev client compatibility. | Not evidence of bare RN compatibility. |
| Package exports/build | Metro root import must resolve package output. | Metro root import must resolve package output. | Same plus native module resolution. | Same plus custom native runtime. | Metro/TS must resolve without Expo assumptions. |

## Risks

| Risk ID | Risk | Evidence | Workflow impact | Severity |
| --- | --- | --- | --- | --- |
| WF-01 | React Native bundled as `dependencies` can duplicate host runtime. | `package.json`; ADR 0005; `audit/05-dependencies.md` DEP-01 | All RN workflows | Critical |
| WF-02 | Expo-specific dependency can make the package hard Expo-only. | `expo-clipboard` in `dependencies`; `utils/clipboard.ts`; lockfile peer on `expo` | Non-Expo RN, Expo Go, managed | High |
| WF-03 | Native modules lack documented install/gate policy. | `@react-native-async-storage/async-storage`, `react-native-safe-area-context`, `react-native-svg` in `dependencies`; Risk Assessment 0005 | Expo Go, managed, prebuild, bare RN | High |
| WF-04 | Preview web shims hide real consumer requirements. | `preview-web/vite.config.ts`; `tsconfig.preview.json`; `audit/06-build-and-packaging.md` BLD-06 | All consumer smoke tests | High |
| WF-05 | Build external list does not match dependency policy. | `tsup.config.ts`; `audit/05-dependencies.md` DEP-04 | Package install/import, Metro | High |
| WF-06 | Package exports/main/types are not release-proven. | `package.json`; `audit/06-build-and-packaging.md` BLD-01/BLD-02 | All workflows | Critical |
| WF-07 | Web-only/native-null components can look compatible in preview but fail behavior expectations on native. | `audit/components/platform-limitations.md` | Expo Go, managed, bare RN | High |

## Mitigations

| Mitigation | Applies to | Evidence link |
| --- | --- | --- |
| Move host runtimes to peer dependency policy in a package metadata ticket. | `react`, `react-native`, `react-dom`, `react-native-web` | ADR 0005, ADR 0006, BC-010 |
| Classify native modules as required peer or optional peer before release. | Safe area, AsyncStorage, clipboard, SVG/icons | Risk Assessment 0005, this register |
| Require Jira ticket for every new native dependency. | All future native deps | ADR 0005 and `native-dependency-gate.md` |
| Require ADR for baseline-changing native/Expo dependencies. | Expo hard requirement, prebuild requirement, core provider native dependency | ADR 0005, ADR 0008 |
| Require Risk Assessment for Expo Go/managed/prebuild uncertainty. | Native modules and package install changes | Risk Assessment 0005/0006 |
| Run PLRNUI-8 clean app smoke without local preview shims. | All workflows | ADR 0005/0006 verification requirements |
| Treat failed Expo/RN smoke as release blocker. | Release readiness | ADR 0006 checklist and Risk Assessment 0006 |

## Release blockers

These block release readiness until resolved or explicitly accepted by the project owner:

| Blocker | Evidence | Required validation |
| --- | --- | --- |
| Clean Expo app cannot install package and import root API | ADR 0005 verification; ADR 0006 release checklist | PLRNUI-8 smoke app root import |
| Duplicate React/RN or incompatible peer graph | `package.json`; `package-lock.json`; Risk Assessment 0006 | PLRNUI-8 dependency tree check |
| Native module missing in Expo Go | Risk Assessment 0005 | PLRNUI-8 run in Expo Go or documented limitation |
| Managed workflow requires prebuild without ADR | ADR 0005 says prebuild only after approved decision | Jira/ADR gate |
| Package works only with preview shims | `preview-web/vite.config.ts`; `tsconfig.preview.json`; BLD-06 | Clean consumer without repo aliases |
| `npm pack --dry-run` or consumer install fails | ADR 0006; Risk Assessment 0006 | PLRNUI-8 package smoke |

## Relationship with PLRNUI-8

PLRNUI-8 must be the executable validation of this policy. PLRNUI-7 defines the dependency policy and risk register; PLRNUI-8 must prove the package can be consumed in clean Expo/RN scenarios.

PLRNUI-8 is a release blocker because:

- ADR 0005 requires a smoke app Expo pulita before release candidate.
- ADR 0006 requires `npm pack --dry-run`, clean install, root import, TypeScript declarations, and duplicate React/RN checks.
- Risk Assessment 0005 requires Expo Go/managed/prebuild verification for native dependencies.
- Risk Assessment 0006 marks consumer installation failure as critical.

Minimum PLRNUI-8 outcomes:

- Pass: clean app installs package, imports root, renders minimal supported components, and documents native workflow support.
- Fail/blocker: install/import/render fails, native module missing, duplicate React/RN detected, package requires undocumented prebuild/dev client, or package only works with local repo shims.
