# SideBar

Sidebar per web (vedi `SideBar.web.tsx`).

## Import

```ts
import { SideBar } from "@personal-library/react-native-components";
```

## Props

```ts
export function SideBar({ width = 280 }: { width?: number })
```

## Note

- Su web: renderizza una sidebar collassabile.
- Su native: `SideBar.tsx` ritorna `null` (si usa `BottomBar` o un overlay).
