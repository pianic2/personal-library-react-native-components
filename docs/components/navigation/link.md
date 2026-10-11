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
  routerAdapter?: LinkRouterAdapter;
  disabled?: boolean;
  accessibilityLabel?: string;
}
```

## Children

- Se `children` sono solo `string | number`, vengono renderizzati dentro `Text`.
- Se `children` sono complessi (layout), vengono renderizzati dentro una `View`.

## Usage

```tsx
<Link href="/settings">Settings</Link>
<Link href="https://example.com" underline>External</Link>
<Link href="/buy" variant="button" size="lg" disabled={!canBuy}>Buy</Link>
```

## Accessibility

- The link has `accessibilityRole="link"`; `accessibilityLabel` passes through (otherwise the screen reader reads the children).
- `disabled` blocks `onPress` and navigation, sets `accessibilityState.disabled` and dims the link.
- On web the `href` is rendered on the anchor, so "open in new tab" and "copy link address" work; external `http(s)` links open with `target="_blank"` and `rel="noopener noreferrer"`. A plain click is handled by the Link (router adapter, navigation context, or the browser fallback).
- The pressed and disabled opacities and the button heights are typed constants in `Link.tsx` (no inline numbers).
