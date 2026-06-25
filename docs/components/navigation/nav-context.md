# NavContext

**Stability:** beta for `NavProvider`; internal / non-stable for navigation helper hooks unless separately promoted.


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

- `useNav()` (throw se non sei dentro provider)
- `useNavigate()`
