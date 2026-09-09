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

## Hook

- `useNav()` — **beta**; throws if used outside `NavProvider`.
- `useNavigate()` — **experimental**; root-visible but provisional and not recommended as a stable production dependency.
