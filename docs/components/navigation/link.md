# Link

**Stability:** beta — public consumer API, usable but contract may still change.

Link “smart” che:

- usa `NavProvider` se presente
- gestisce link esterni (`http(s)://`)
- fallback su web con `window.location.assign`

## Import

```ts
import { Link } from "@personal-library/react-native-components";
```

## Props

```ts
type LinkVariant = "text" | "button";
type LinkSize = "sm" | "md" | "lg";

export interface LinkProps {
  href: string;
  children: React.ReactNode;
  variant?: LinkVariant;
  size?: LinkSize;
  underline?: boolean;
  containerStyle?: ViewStyle | ViewStyle[];
  style?: TextStyle | TextStyle[];
  activeStyle?: TextStyle | TextStyle[];
  activeContainerStyle?: ViewStyle | ViewStyle[];
  exact?: boolean;
  onPress?: () => void;
}
```

## Children

- Se `children` sono solo `string | number`, vengono renderizzati dentro `Text`.
- Se `children` sono complessi (layout), vengono renderizzati dentro una `View`.
