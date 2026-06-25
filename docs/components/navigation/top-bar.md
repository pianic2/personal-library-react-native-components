# TopBar

**Stability:** experimental — provisional API, not recommended for production dependency.

Barra di navigazione in alto (web-only).

## Import

```ts
import { TopBar } from "@personal-library/react-native-components";
```

## Props

```ts
export interface TopBarProps {
  title?: string;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}
```

## Note

- Se `Platform.OS !== "web"` ritorna `null`.
- Se `centerSlot` non è fornito, renderizza i `NavItem` come link.
