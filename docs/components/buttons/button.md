# Button

Pulsante basato su `Pressable` con varianti e dimensioni.

## Import

```ts
import { Button } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "primary" | "secondary" | "ghost" | "danger" | "info";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps {
  icon?: ComponentType<{ size?: number; color?: string }>;
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
}
```

## Note

- Se `icon` e `label` sono entrambi assenti, in dev logga un warning.
- Le dimensioni (height, padding, iconSize) sono mappate internamente per size.
