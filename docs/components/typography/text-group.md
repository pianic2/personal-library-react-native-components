# TextGroup

Wrapper che impila i children e applica spacing verticale tra gli elementi.

## Import

```ts
import { TextGroup } from "@personal-library/react-native-components";
```

## Props

```ts
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

interface TextGroupProps extends ViewProps {
  spacing?: SpaceKey;
  children: React.ReactNode;
}
```
