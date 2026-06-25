# Card

Surface container con variant (`default` / `elevated` / `outline`) e shadow.

## Import

```ts
import { Card } from "@personal-library/react-native-components";
```

## Props

```ts
interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bgColor?: string;
  radius?: number;
  margin?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  padding?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  variant?: "default" | "elevated" | "outline";
  shadow?: Shadow;
}
```

## Comportamento

- `variant` determina il default `shadow` se `shadow` non è passato.
- `outline` aggiunge un bordo.
