# Box

`Box` è un wrapper di layout che applica rapidamente token del tema (padding, margin, background, radius, border, shadow).

## Import

```ts
import { Box } from "@personal-library/react-native-components";
```

## Props

Deriva da `ViewProps` e aggiunge:

```ts
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];
type RadiusKey = keyof ReturnType<typeof useTheme>["theme"]["radius"];
type ShadowKey = keyof ReturnType<typeof useTheme>["theme"]["shadows"];

interface BoxProps extends ViewProps {
  padding?: SpaceKey;
  margin?: SpaceKey;
  bg?: keyof ReturnType<typeof useTheme>["colors"];
  radius?: RadiusKey;
  border?: boolean;
  shadow?: ShadowKey;
  style?: StyleProp<ViewStyle>;
}
```

## Note

- `bg` mappa su `colors[...]`.
- `shadow` usa i token `theme.shadows[...]`.
