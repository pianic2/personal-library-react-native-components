# Select

**Stability:** experimental — provisional API, not recommended for production dependency.

Select controllato con overlay (usa `Modal` di React Native).

## Import

```ts
import { Select } from "@personal-library/react-native-components";
```

## Props

```ts
interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}
```

## Note

- L’UI di selezione usa un `Modal` full-screen con lista di opzioni.
