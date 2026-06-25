# Alert

Alert “inline” con varianti colore e azione opzionale.

## Import

```ts
import { Alert } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "primary" | "info" | "success" | "warning" | "error";

interface AlertProps {
  title?: string;
  variant?: Variant;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```
