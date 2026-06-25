# Divider

Separatore orizzontale a piena larghezza.

## Import

```ts
import { Divider } from "@personal-library/react-native-components";
```

## Props

```ts
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

interface DividerProps {
  thickness?: number;
  spacing?: SpaceKey;
  style?: ViewStyle | ViewStyle[];
}
```

## Comportamento

- `thickness` imposta l’altezza del separatore.
- `spacing` controlla `marginVertical` tramite `theme.space[spacing]`.
