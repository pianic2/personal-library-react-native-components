# Tooltip

**Stability:** experimental — provisional API, not recommended for production dependency.

Tooltip con delay (web-only).

## Import

```ts
import { Tooltip } from "@personal-library/react-native-components";
```

## Props

```ts
type Placement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: string;
  placement?: Placement;
  delay?: number;
  children: React.ReactNode;
}
```

## Note

- Se `Platform.OS !== "web"` ritorna semplicemente `children`.
