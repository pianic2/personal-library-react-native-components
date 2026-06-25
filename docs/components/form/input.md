# Input

Campo input basato su `TextInput` con label, helper text, stato errore e slot icone.

## Import

```ts
import { Input } from "@personal-library/react-native-components";
```

## Props

```ts
interface InputProps extends TextInputProps {
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
  error?: boolean;
  helperText?: string;
  editable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

## Esempio

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  helperText="Useremo questa email per contattarti."
/>
```
