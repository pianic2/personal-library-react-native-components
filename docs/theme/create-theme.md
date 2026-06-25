# createTheme

**Stability:** beta — public consumer API, usable but contract may still change.

Helper per fare deep-merge di override su un tema base.

## Import

```ts
import { createTheme } from "@personal-library/react-native-components";
```

## Firma

```ts
export function createTheme(
  overrides?: Partial<Theme>,
  baseTheme?: Theme
): Theme
```

## Note

- Fa merge ricorsivo sugli oggetti (non su array).
