# NavBar

**Stability:** beta — public consumer API, usable but contract may still change.

Componente “orchestrator” che wrapppa `NavProvider` e renderizza un layout tra `TopBar` / `BottomBar` / `SideBar`.

## Import

```ts
import { NavBar, type NavItem } from "@personal-library/react-native-components";
```

## Props

```ts
export interface NavBarProps {
  items?: NavItem[];
  logo?: React.ReactNode;
  pathname: string;
  navigate: (href: string) => void;
  layout?: "auto" | "top" | "bottom" | "sidebar";
  bottomMaxItems?: number;
  sidebarWidth?: number;
}
```

## Note

- `layout="auto"` sceglie `top` su web, `bottom` su native.
