# Badge

**Stability:** beta — public consumer API, usable but contract may still change.

Badge testuale con varianti.

## Import

```ts
import { Badge } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends TextProps {
  children: React.ReactNode;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  variant?: Variant;
}
```

## Usage

```tsx
<Badge>New</Badge>

<Badge variant="success">Paid</Badge>

<Badge variant="danger">{3}</Badge>

<Badge variant="info" accessibilityLabel="3 unread messages">3</Badge>
```

See `examples/surfaces.tsx` for all five variants next to the Card variants.

## Accessibility

- The text colour is whichever of the `textPrimary` and `textInverted` tokens has the higher WCAG contrast on the variant background; the tests check at least 4.5:1 for the five variants in light and dark.
- A count-only badge (a number, or a string of digits) gets an `accessibilityLabel` equal to the count. Pass `accessibilityLabel` to override it, for example `"3 unread messages"`; it also applies to non-count badges.

## Note

- Su web renderizza direttamente `Text` inline.
- Su native usa `View + Text` per gestire meglio `borderRadius`.
