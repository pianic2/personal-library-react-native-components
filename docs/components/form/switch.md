# Switch

**Stability:** beta — public consumer API, usable but contract may still change.

Switch controllato.

## Import

```ts
import { Switch } from "@personal-library/react-native-components";
```

## Props

```ts
interface SwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```
