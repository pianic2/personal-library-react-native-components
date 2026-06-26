# Personal Library React Native Components

Package target: `@personal-library/react-native-components`

React Native component library for shared app UI, built around reusable
components, theme primitives and design tokens.

## Status

This repository is the clean canonical repository for the React Native component
library. It starts as an enterprise baseline while migration work is in
progress.

The current package surface is governed and pre-stable, not merely the minimal
PLRNUI-13 baseline. Consumers must use the root package entrypoint only. The
root API includes beta component/theme/token utilities and explicitly documented
experimental surfaces, while `stable` remains zero until a future promotion
gate.

Current RC posture:

- `CONDITIONAL GO` to enter PLRNUI-41 hardening.
- `NO-GO` to cut or publish an RC artifact until native runtime, version and
  owner publication gates close.

## Audit Evidence

`audit/` contains governance evidence imported from previous PLRNUI work:
analysis reports, ADRs, registers, release checks, migration notes, and related
verification material.

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
- experimental root surface: provisional APIs such as overlays and app-shell /
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

Source migration is ticket-driven. Do not migrate components, tokens, themes, or
public APIs without the related PLRNUI issue and audit evidence.

Useful commands:

```sh
npm run dev
npm run typecheck
npm run build
npm run build:prod
npm run package:dry-run
npm run release:check
```

## PLRNUI Scope

PLRNUI-13 creates the canonical enterprise baseline.

PLRNUI-14 owns advanced package metadata.

PLRNUI-18 owns the selective migration plan.

Component migration and public API stabilization happen in later tickets.
