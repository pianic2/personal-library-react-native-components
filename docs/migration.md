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
