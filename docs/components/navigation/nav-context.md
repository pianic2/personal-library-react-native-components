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
}

export interface NavContextValue {
  logo?: React.ReactNode;
  items: NavItem[];
  pathname: string;
  navigate: (href: string) => void;
}
```

## NavProvider

Props:

- `items: NavItem[]`
- `logo?: React.ReactNode`
- `pathname: string`
- `navigate: (href: string) => void`

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

`useNavItems`, `useNavLogo`, `useNavPathname` and `useOptionalNav` are exported from the component folder but not yet from the package root.
