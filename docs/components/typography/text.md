# Text

Componente base tipografico (wrapper di `react-native` `Text`) che applica token di font size/weight, colori e allineamento.

## Import

```ts
import { Text } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "default" | "muted" | "danger" | "success";
type Align = "left" | "center" | "right" | "justify";

interface Props extends TextProps {
  variant?: Variant;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  weight?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontWeight"];
  align?: Align;
  truncate?: boolean;
}
```

## Comportamento

- `variant` controlla il colore (es. `muted` → `colors.textMuted`).
- `truncate=true` imposta `numberOfLines=1` e `ellipsizeMode="tail"`.
