# RadioGroup

**Stability:** beta — public consumer API, usable but contract may still change.

Gruppo di radio button controllato.

## Import

```ts
import { RadioGroup } from "@personal-library/react-native-components";
```

## Props

```ts
interface Option {
  label: string;
  value: string;
}

interface RadioGroupProps {
  value?: string;
  onChange: (v: string) => void;
  options: Option[];
}
```
