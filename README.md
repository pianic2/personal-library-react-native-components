# personal-library-react-native-components

Package target: `@personal-library/react-native-components`

React Native component library baseline.

## Status

This repository is the clean canonical repository for the React Native component
library. It starts as an enterprise baseline while migration work is in
progress.

The repository was created from a clean directory. Runtime source, package API,
and component migration are intentionally minimal in PLRNUI-13.

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

Minimal consumer docs and examples are available in:

- `docs/getting-started.md`
- `docs/components.md`
- `docs/platform-support.md`
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
