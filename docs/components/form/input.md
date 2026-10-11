# Input

**Stability:** beta — public consumer API, usable but contract may still change.

Campo input basato su `TextInput` con label, helper text, stato errore e slot icone.

## Import

```ts
import { Input } from "@personal-library/react-native-components";
```

## Props

```ts
interface InputProps extends TextInputProps {
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  error?: boolean;
  helperText?: string;
  editable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}
```

## Comportamento

- `label` è opzionale (per esempio dentro `FormField`, che mostra già l'etichetta). Senza `label` non viene reso il testo dell'etichetta e, in `__DEV__`, un avviso segnala che manca anche `accessibilityLabel`.
- `label` non viene passato al `TextInput` sottostante; diventa l'`accessibilityLabel` (se non ne è dato uno esplicito).
- `Input` rende un `View` radice: `containerStyle` si applica a quel wrapper, `style` al `TextInput`.

## Esempio

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  helperText="Useremo questa email per contattarti."
/>
```
