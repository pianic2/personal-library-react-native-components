# PLRNUI-25 - Docs Import Audit

## Scope

Audit the current repository for consumer-facing import examples and legacy/deep import references after the package identity was approved as `@personal-library/react-native-components`.

PLRNUI-25 does not read or copy from the old repository. The findings below are based only on the current checkout.

## Approved package identity

Consumer-facing examples must import from:

```ts
import { Button } from "@personal-library/react-native-components";
```

Package metadata currently exposes only the root package entrypoint and `./package.json`. No functional subpath exports are approved in `package.json`.

## Forbidden consumer-facing imports

- `@aura/ui`
- `@your-scope/ui`
- `AURA`
- `aura`
- `src/**`
- `dist/**`
- repo-relative root imports such as `../../index`
- repo-relative internal imports such as `../../theme/types`
- direct component internals such as `src/components/Button/Button`
- package subpaths not declared in `package.json`

## Initial findings

| Area | Finding | Treatment in PLRNUI-25 |
| --- | --- | --- |
| `README.md` | Current README already uses canonical package target and states no active `@aura/ui` alias. It did not contain a consumer code example. | Added a minimal canonical root import example. |
| `docs/` | Directory is absent in the current checkout. Historical audit files still mention legacy `docs/**` imports such as `from "AURA"`. | No real docs files to edit; historical rows remain migration notes. |
| `examples/` | Directory is absent in the current checkout. | No files to edit. |
| `demo/` / `preview-web/` | Directories are absent in the current checkout. Historical audit files still mention repo-relative demo imports. | No real demo/preview files to edit; historical rows remain migration notes. |
| `audit/` | Contains many intentional historical references to AURA, `@aura/ui`, `from "AURA"` and previous demo paths. | Preserved as audit/migration evidence, not consumer-facing current docs. |
| `src/` | Source uses internal relative imports by design. Root API still exports deprecated `getAuraTokens` as tracked by API governance. | Not treated as docs cleanup; runtime/API cleanup belongs to separate token/API tickets. |
| `tests/` | Tests import from `../../src` for source-level verification. | Allowed test-local import, not a consumer-facing example. |

## Final status

- Current consumer-facing README import example uses `@personal-library/react-native-components`.
- No current `docs/`, `examples/`, `demo/` or `preview-web/` files exist to migrate in this checkout.
- Legacy AURA and deep-import references remain inside audit artifacts only, where they are marked as historical migration evidence or prior findings.
- No package metadata, lockfile, runtime component logic or dependencies were changed.

## Residual limits

- Historical audit files still document old docs/demo gaps. They should stay as evidence unless a future ticket explicitly rewrites historical audit records.
- Clean consumer TypeScript import and Metro/runtime verification remain deferred to release/consumer smoke work.
- Stable promotion remains blocked until component-specific runtime, accessibility, focus/keyboard and consumer support evidence is complete.

