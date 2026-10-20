# Card

**Stability:** internal / non-stable — not part of the public consumer API.

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
  bgColor?: string; // a colour token key of the theme ("surface", "primary", ...) or any colour string
  radius?: number;
  margin?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  padding?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  variant?: "default" | "elevated" | "outline";
  shadow?: Shadow;
}
```

## Usage

```tsx
<Card>
  <Text>Default card</Text>
</Card>

<Card variant="elevated" padding="lg">
  <Text>Elevated card</Text>
</Card>

<Card variant="outline" bgColor="surface">
  <Text>Outline card with a token background</Text>
</Card>
```

See `examples/surfaces.tsx` for Card and Badge together.

## Comportamento

- `variant` determina il default `shadow` se `shadow` non è passato.
- `outline` aggiunge un bordo.
- `bgColor` accepts a colour token key of the current theme (for example `"surface"`, `"primary"`); any other string is used as a raw colour.
- Android applies `elevation` and also forwards the shadow colour (`shadowColor`) of the token, which API 28+ uses to tint the shadow.
