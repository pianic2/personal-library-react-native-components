# FormField

Wrapper per label + helper/error text e pass-through di alcune props al child (es. `error`, `status`, `aria-*`).

## Import

```ts
import { FormField } from "@personal-library/react-native-components";
```

## Props

```ts
type FormStatus = "default" | "error" | "success" | "warning";

interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  variant?: string;
  colorScheme?: string;
  status?: FormStatus;
  style?: ViewStyle | ViewStyle[];
  id?: string;
  children: React.ReactElement;
}
```

## Comportamento

- Se `errorText` è presente (o `status === "error"`), forza lo stato a `error`.
- Se il child supporta certe props, `FormField` le imposta via `React.cloneElement`.
