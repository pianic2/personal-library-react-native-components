# Row

**Stability:** beta — public consumer API, usable but contract may still change.

`Row` è un layout orizzontale (`flexDirection: "row"`) con supporto a `gap`, `align`, `justify` e wrap.

## Import

```ts
import { Row } from "@personal-library/react-native-components";
```

## Props

```ts
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

interface RowProps extends ViewProps {
  gap?: SpaceKey;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap?: boolean;
  children: React.ReactNode;
  flex?: number;
}
```

## Comportamento

- `gap` è applicato come `columnGap` usando `theme.space[gap]`.
- `wrap=true` usa `flexWrap: "wrap"` e applica lo stesso valore di `gap` anche come `rowGap` (`theme.space[gap]`), così le righe a capo restano distanziate quanto le colonne.
- `flex` è applicato allo `style` del `View` (`style.flex`) e non viene inoltrato come prop al `View`. Uno `style` passato dal consumatore ha la precedenza.
