# PLRNUI-7 - Native Dependency Gate

## Core rule

No new native dependency may be added without a Jira ticket.

This applies to:

- direct `package.json` additions;
- transitive native requirements introduced through JS packages;
- Expo modules;
- React Native native modules;
- config plugins;
- dependencies that require autolinking;
- dependencies that force prebuild/custom dev client/bare workflow.

Evidence basis:

- ADR 0005: no uncontrolled native dependencies without ADR or explicit technical decision.
- Risk Assessment 0005: native dependencies can break Expo Go, managed workflow, Metro, and clean consumers.
- ADR 0006 and Risk Assessment 0006: release requires clean package install and consumer smoke tests.

## When Jira is required

Jira is required for every native or potentially native dependency change, including:

- adding a package;
- upgrading a package across Expo/RN compatibility boundaries;
- changing a package from optional to required;
- moving package sections between `dependencies`, `peerDependencies`, `optionalDependencies`, `devDependencies`;
- adding a package whose peer dependencies include `react-native`, `expo`, native modules, or config plugins;
- adding a package used by a root-exported API.

Minimum Jira fields:

- package name and version/range;
- feature requiring the package;
- source/API that will import it;
- current and proposed package section;
- Expo Go impact;
- managed workflow impact;
- prebuild/dev client impact;
- bare RN impact;
- alternatives considered, including JS-only option;
- PLRNUI-8 smoke scenario to cover it.

## When ADR is required

ADR is required when a dependency decision changes architecture, baseline, or public contract.

ADR required if:

- Expo becomes a hard package requirement;
- a native module becomes required by root import or default provider behavior;
- prebuild/custom dev client becomes required for a supported feature;
- the package stops being React Native general-purpose;
- public API must be split to isolate optional native features;
- dependency policy causes a breaking change for consumers;
- an existing native dependency is removed or made optional in a way that changes runtime behavior.

Evidence examples:

- `expo-clipboard` as a hard dependency would change Expo policy.
- `react-native-safe-area-context` as required by default `ThemeProvider` affects provider contract.
- `@react-native-async-storage/async-storage` tied to theme/storage API affects core runtime requirements.

## When Risk Assessment is required

Risk Assessment is required when uncertainty or blast radius is high.

Required for:

- unknown Expo Go compatibility;
- managed workflow limitations;
- prebuild/custom dev client requirement;
- native config/plugin requirement;
- Metro resolver or package export risk;
- duplicate React/RN risk;
- privacy/security-sensitive storage;
- broad consumer install impact;
- package section changes involving native deps.

Existing related evidence:

- Risk Assessment 0005 for Expo native dependency risk.
- Risk Assessment 0006 for packaging and consumer installation risk.

## When to update breaking-change register

Update `audit/migration/breaking-change-register.md` when:

- consumers must install new peers explicitly;
- a dependency moves from bundled dependency to peer/optional peer;
- a feature no longer works unless a consumer installs an optional peer;
- Expo Go support changes;
- prebuild/dev client becomes required;
- root exports are moved to isolate native features;
- dependency removal affects public API behavior.

Existing register links:

- BC-005: peer dependency compatibility policy.
- BC-006: native dependency gate.
- BC-008: register/changelog freshness gate.

## When PLRNUI-46 smoke test is required

PLRNUI-46 smoke test is required for:

- every native dependency currently declared;
- every optional peer candidate that affects runtime code;
- every package section change involving host/native dependencies;
- root import and render in clean Expo app;
- peer install validation;
- Expo Go compatibility;
- managed workflow compatibility;
- prebuild/dev client requirement validation;
- duplicate React/RN checks.

PLRNUI-46 must remain a release blocker for current package readiness because ADR 0005 and ADR 0006 require clean consumer verification before release candidate.

## Approval checklist

Before approving a native dependency:

| Check | Required evidence |
| --- | --- |
| Jira exists | Ticket key in dependency decision record |
| Package identified | Name, version/range, package section |
| Source usage identified | File path and exported API importing or requiring the package |
| Native status classified | Native, potentially native, Expo-specific, JS-only, host runtime |
| Autolinking assessed | Yes/no and workflow notes |
| Expo Go assessed | Supported, unsupported, unknown, or blocked with evidence |
| Managed workflow assessed | Supported/unsupported/unknown with version baseline |
| Prebuild/dev client assessed | Required/not required/unknown |
| Config plugin assessed | Required/not required/unknown |
| Consumer impact assessed | Install, bundle, runtime, API, docs |
| Alternative assessed | JS-only or adapter-based alternative considered |
| ADR decision made | Required/not required with rationale |
| Risk Assessment decision made | Required/not required with rationale |
| Breaking-change register decision made | Updated/not required with rationale |
| PLRNUI-46 scenario added | Smoke test case named |
| Release blocker status set | Blocker until smoke passes or limitation accepted |

## Current native dependency state after PLRNUI-44

Current `package.json` does not declare native runtime packages in `dependencies`. Gate tracking remains required for approved contracts and future introductions.

| Package | Current package state | Gate status |
| --- | --- |
| `react-native` | `peerDependencies` | Host runtime peer; consumer-owned; must not be bundled. |
| `react-native-safe-area-context` | Not declared | Governed by PLRNUI-37 required peer contract while `ThemeProvider` safe-area behavior remains default. Future metadata change must pass this gate. |
| `@react-native-async-storage/async-storage` | Not declared | Consumer-owned adapter backend under PLRNUI-38; must not be added as required core runtime dependency. |
| `expo-clipboard` | Not declared | Consumer-owned adapter backend under PLRNUI-39; must not be added to core package metadata or imported by core runtime. |
| `react-native-svg` | Not declared | Future native dependency candidate only; gate required before package metadata or runtime introduction. |
| `lucide-react-native` | Not declared | Future native-adjacent dependency candidate only; gate required before package metadata or runtime introduction. |

## Non-compliant patterns

These patterns should block dependency approval:

- adding native package directly to `dependencies` without Jira;
- adding Expo package that makes non-Expo RN fail;
- relying on preview shims as compatibility proof;
- skipping clean consumer install;
- skipping Expo Go/managed/prebuild notes;
- adding peer dependencies without docs and smoke test;
- treating transitive native peers as invisible;
- changing dependency sections without breaking-change review.
