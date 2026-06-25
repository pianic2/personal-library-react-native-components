# Checkbox

**Stability:** beta — public consumer API, usable but contract may still change.

Checkbox controllata.

## Import

```ts
import { Checkbox } from "@personal-library/react-native-components";
```

## Props

```ts
interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```
