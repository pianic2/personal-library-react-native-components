# BottomBar

Barra di navigazione in basso (tipicamente per mobile). Usa `NavContext` per items e pathname.

## Import

```ts
import { BottomBar } from "@personal-library/react-native-components";
```

## Props

```ts
export function BottomBar({ maxItems = 5 }: { maxItems?: 3 | 4 | 5 })
```

## Comportamento

- Mostra massimo `maxItems` elementi (slice dell’array).
- Per l’item attivo: `activeIcon ?? icon`.
