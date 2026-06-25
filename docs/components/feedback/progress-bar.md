# ProgressBar

**Stability:** internal / non-stable — not part of the public consumer API.

Barra di progresso (0–100) con variante colore.

## Import

```ts
import { ProgressBar } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "primary" | "info" | "success" | "warning" | "error";

interface ProgressBarProps {
  progress?: number; // 0–100
  color?: Variant;
}
```
