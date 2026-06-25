# Heading

Heading semantico basato su `Text` con mapping `level → size` e `weight="bold"`.

## Import

```ts
import { Heading } from "@personal-library/react-native-components";
```

## Props

```ts
type Level = 1 | 2 | 3 | 4 | 5 | 6;
type TextProps = ComponentProps<typeof Text>;

interface HeadingProps extends TextProps {
  level?: Level;
  children: string;
}
```

## Comportamento

- `level=1` → `size="xxxl"`, …, `level=6` → `size="sm"`.
