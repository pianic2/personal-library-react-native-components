# Migration Notes

## Stability labels

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.

The current package identity is:

```txt
@personal-library/react-native-components
```

Consumer code should migrate examples and imports to the root package entrypoint:

```tsx
import { Button, Text } from "@personal-library/react-native-components";
```

## Unsupported Import Forms

Do not use legacy package names, repo-relative imports, deep source paths, build output paths, or direct component internals in consumer code.

## Stability Migration

No component is currently `stable`. Treat public candidates as `beta` and platform-risk components as `experimental` until the stable gate is complete.

Internal/non-stable APIs are not part of the public consumer API. Deprecated or
legacy names such as `auraTokens` and `getAuraTokens` are historical migration
terms only and must not be recommended in consumer examples.

Historical migration evidence remains under `audit/`. Those files may mention legacy names and old demo paths as historical findings; they are not current consumer-facing examples.

## Consumer Examples vs Demo Harness

Consumer examples live under `examples/` and must import only from the approved
public package entrypoint:

```tsx
import { Button, Text } from "@personal-library/react-native-components";
```

Do not use repo-relative package paths such as `../../index` or
`../../theme/types`, and do not use `src/*`, `dist/*`, or non-public subpaths in
consumer-facing snippets.

Repo-local demo or preview harness files, if present, may use local paths only
as development infrastructure. They are not package validation, not consumer API
source of truth, and any missing public API/type must be registered as an audit
gap instead of bypassed through a deep import.

Preview web runtime limits are documented in
[Preview web shims and runtime limits](preview-runtime-limits.md). Preview web
success is not Expo/RN validation.
