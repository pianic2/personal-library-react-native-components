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
  sidebarVariant?: SideBarVariant;
}
```

## Usage

```tsx
<NavBar
  items={[{ label: "Home", href: "/" }, { label: "Library", href: "/library" }]}
  pathname={pathname}
  navigate={navigate}
  layout="auto"
/>
```

## Layout

- `layout="auto"` (default) picks `top` when `Platform.OS === "web"` and `bottom` on iOS and Android.
- `layout="top"`, `"bottom"` and `"sidebar"` force that bar on every platform.
- `bottomMaxItems` (default 5) limits the items of the bottom bar; `sidebarWidth` (default 260) and `sidebarVariant` apply to the sidebar.

## Accessibility

- The current item (the one whose `href` equals `pathname`) has `accessibilityState.selected = true`, the others `false`. This holds for the top and bottom bars; the bottom bar items are `tab`s in a `tablist`.
- Both bars are navigation landmarks (`role="navigation"`).

## Note

- `NavBar` wraps its children in `NavProvider`, so `Link` and the `use*` hooks work below it.
