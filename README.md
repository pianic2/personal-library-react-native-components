# Personal Library React Native Components

Package: `@personal-library/react-native-components`

React Native component library for shared app UI, built around reusable
components, theme primitives and design tokens.

## Status

The repository migration and hardening programme is complete. The current
package surface is governed and **pre-stable**: beta APIs are usable but may
change, experimental APIs are provisional, and `stable` remains zero until a
future promotion gate.

First release-candidate preparation targets **`0.1.0-rc.1`**. The package is
configured for the public npm registry with the **`rc`** dist-tag; using
`latest` for this RC is intentionally forbidden by the release guard.

Current first-RC runtime boundary:

- Expo Go Android on Expo SDK 57 / React Native 0.86.3: validated PASS.
- Native Android outside the Expo Go proof lane: owner-accepted residual, not a
  validated PASS claim.
- Native iOS: owner-accepted residual, not a validated PASS claim.
- Prebuild, custom dev client and EAS build are outside the selected first-RC
  support claim.

The RC may be prepared and certified, but **npm publication, Git tag and GitHub
Release require the separate final PLRNUI-61 authorization**.

## Installation

After the RC is published, pin the prerelease explicitly:

```sh
npm install @personal-library/react-native-components@0.1.0-rc.1
```

Do not treat the RC as a stable release.

## Feedback and Improvement Intake

Consumer findings, bug reports, compatibility problems, feature requests,
documentation gaps, accessibility concerns, performance observations and other
improvement ideas should be submitted through the repository's single
**Improvement Intake** GitHub Issue Form:

https://github.com/pianic2/personal-library-react-native-components/issues/new/choose

The GitHub issue is an external intake record, not an approved development
task. Reports are deduplicated and normalized into the project's canonical
Jira/Confluence improvement process, evaluated in the weekly ideation cycle,
and may later be proposed for a release. Release scope still requires Product
Owner approval before autonomous implementation.

When reporting a problem, include reproducible evidence and relevant package,
Expo, React Native, React and platform versions when known. Never include
passwords, tokens, OTPs, private keys or other sensitive data.

## Audit Evidence

`audit/` contains governance evidence from PLRNUI work: analysis reports, ADRs,
registers, release checks, migration notes, and verification material.

`audit/` is not runtime source code, is not consumer-facing documentation, and is
not part of the published package API. Legacy references inside `audit/` are
historical or governance evidence only.

There is no active legacy package alias.

## Development

Consumer-facing examples should use the root package entrypoint:

```ts
import { Button, Text } from "@personal-library/react-native-components";
```

Deep imports from `src/`, `dist/`, component internals, or legacy package names
are not supported consumer API.

Consumer examples live in `examples/` and must remain copy-pasteable from the
published package root:

- use `@personal-library/react-native-components`;
- do not use repo-relative imports such as `../../index` or
  `../../theme/types`;
- do not use `src/*`, `dist/*`, or unapproved package subpaths.

Repo-local demo or preview harnesses, when present, are development
infrastructure only. Their local paths and shims are not representative of
package consumers, and demo/preview success is not package validation.

Stability labels used in docs:

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component or API is classified as stable.

Surface boundaries:

- root public/beta surface: documented root imports that may still change
  before stable release;
- experimental root surface: provisional APIs such as overlays and selected
  navigation surfaces that are root-visible but not stable;
- internal/non-public surface: repository implementation details, preview
  shims, source-tree-only inventory entries and unexported helpers;
- source-tree inventory is not the same as the package root API.

Consumer docs and examples are available in:

- `docs/index.md`
- `docs/getting-started.md`
- `docs/components.md`
- `docs/theme.md`
- `docs/tokens/index.md`
- `docs/platform-support.md`
- `docs/preview-runtime-limits.md`
- `docs/expo-rn-metro-troubleshooting.md`
- `docs/migration.md`
- `examples/basic-usage.tsx`
- `examples/overlays.experimental.tsx`

Useful commands:

```sh
npm run dev
npm run typecheck
npm test
npm run build
npm run package:dry-run
npm run consumer:smoke
npm run consumer:expo
npm run release:guard
npm run release:check
```

Release preparation is ticket-driven. Do not publish, tag or create a GitHub
Release unless the current publication gate explicitly authorizes it.
