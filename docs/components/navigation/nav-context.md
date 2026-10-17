# NavContext

**Stability:** beta for `NavProvider` and `useNav`; experimental for `useNavigate`. None of these APIs are stable.

Contiene `NavProvider` e i hook per accedere allo stato di navigazione.

## Import

```ts
import {
  NavProvider,
  type NavItem,
  useNav,
  useNavigate,
} from "@personal-library/react-native-components";
```

## Tipi

```ts
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
  hidden?: boolean;
  disabled?: boolean;
  activeMatch?: "exact" | "prefix"; // default "exact"
}

export interface NavAdapter {
  navigate: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  currentPath: () => string;
  subscribe: (listener: () => void) => () => void; // returns the unsubscribe function
}

export interface NavContextValue {
  logo?: React.ReactNode;
  items: NavItem[];
  pathname: string;
  navigate: (href: string) => void;
  replace?: (href: string) => void; // adapter only
  back?: () => void; // adapter only
}
```

## Props

`NavProvider` takes, either the legacy form or the adapter form (not both):

- `items: NavItem[]`
- `logo?: React.ReactNode`
- legacy: `pathname: string` and `navigate: (href: string) => void`
- adapter: `adapter: NavAdapter`; the pathname is read with `adapter.currentPath()` and the provider re-renders when `adapter.subscribe` fires.

The core imports no router. A router package implements `NavAdapter`; none ships with the core.

`NavItem.badge`, `children`, `hidden` and `disabled` are data only: they are carried by the context for navigation components to use. `hidden` items still take part in active matching.

## Active state

- `isActive(href, pathname, match = "exact")` — `"exact"` compares paths ignoring query, hash and trailing slash; `"prefix"` also matches nested paths on a segment boundary (`/library` matches `/library/42` but not `/library-x`). The root `/` matches only `/`.
- `isItemActive(item, pathname)` — true when the item or a descendant matches.
- `findActiveItem(items, pathname)` — the most specific (longest `href`) matching item.
- `useActiveItem()` and `useIsActive(item)` — the same, reading the provider's items and pathname.

## Platform matrix

| Behaviour | iOS | Android | Web |
| --- | --- | --- | --- |
| Legacy `pathname` + `navigate` | verified (unit tests, react-test-renderer) | verified (unit tests) | verified (unit tests) |
| `NavAdapter` subscribe and re-render | verified (unit tests) | verified (unit tests) | verified (unit tests) |
| Device or browser back and history integration | unverified, belongs to the adapter | unverified, belongs to the adapter | unverified, belongs to the adapter |

Tests run on the react-native test renderer, not on devices or browsers; the web path form (query, hash) is handled the same way on every platform.

## Usage

```tsx
<NavProvider items={items} pathname={pathname} navigate={navigate} logo={<Logo />}>
  <TopBar />
</NavProvider>

function CurrentTitle() {
  const pathname = useNavPathname();
  return <Text>{pathname}</Text>;
}
```

## Hook

- `useNav()` — **beta**; returns `{ items, logo, pathname, navigate }` and throws `useNav must be used inside <NavProvider>` outside the provider.
- `useNavItems()` — the `NavItem[]`; throws outside the provider.
- `useNavLogo()` — the `logo` node (`undefined` when none was given); throws outside the provider.
- `useNavPathname()` — the current `pathname`; throws outside the provider.
- `useNavigate()` — **experimental**; root-visible but provisional and not recommended as a stable production dependency. Throws outside the provider.
- `useOptionalNav()` — the context value, or `null` outside the provider (used by `Link` and the bars, which also work without a provider).

`useNavItems`, `useNavLogo`, `useNavPathname`, `useOptionalNav`, the active-state helpers (`isActive`, `isItemActive`, `findActiveItem`, `useActiveItem`, `useIsActive`) and the `NavAdapter` and `NavProviderProps` types are exported from the component folder but not yet from the package root.

## Adapter usage

```tsx
<NavProvider items={items} adapter={myRouterAdapter}>
  <TopBar />
</NavProvider>
```
