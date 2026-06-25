# Column (Stack)

**Stability:** beta for `Column`; internal / non-stable for the `Stack` alias. `Stack` is not part of the public consumer API.


`Column` (alias `Stack`) impila i figli verticalmente e inserisce spacing tra gli elementi.

## Import

```ts
import { Column, Stack } from "@personal-library/react-native-components";
```

## Props

```ts
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

interface ColumnProps extends ViewProps {
  gap?: SpaceKey;
  flex?: -1 | 0 | 1 | 2 | 3;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between";
  children: React.ReactNode;
}
```

## Comportamento

- Filtra i children falsy (`null`, `undefined`, `false`).
- Applica `marginBottom` a tutti i figli tranne l’ultimo usando `theme.space[gap]`.
