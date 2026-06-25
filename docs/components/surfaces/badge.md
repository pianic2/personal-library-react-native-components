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

## Note

- Su web renderizza direttamente `Text` inline.
- Su native usa `View + Text` per gestire meglio `borderRadius`.
