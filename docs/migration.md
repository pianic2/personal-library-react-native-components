# Migration Notes

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

Historical migration evidence remains under `audit/`. Those files may mention legacy names and old demo paths as historical findings; they are not current consumer-facing examples.
