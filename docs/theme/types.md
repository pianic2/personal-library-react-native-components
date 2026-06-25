# Theme types

Tipi principali esportati da `theme/types.ts`.

## Import

```ts
import type { Theme, ThemeMode } from "@personal-library/react-native-components";
```

## ThemeMode

```ts
export type ThemeMode = "light" | "dark";
```

## Theme

`Theme` include `colors` e i token base (`spacing/space`, `radius`, `typography`, `shadows`, `zIndex`, `size`) più un’area opzionale `components` per override per-componente.
