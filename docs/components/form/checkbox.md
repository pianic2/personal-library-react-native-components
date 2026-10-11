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
  checkIcon?: React.ReactNode;
  indeterminate?: boolean; // reported as checked: "mixed"
  invalid?: boolean; // error colour for the box
}
```

## Usage

```tsx
<Checkbox label="Accept the terms" checked={accepted} onChange={setAccepted} />
<Checkbox label="Select all" checked={all} indeterminate={some && !all} onChange={toggleAll} />
<Checkbox label="Accept the terms" checked={false} invalid onChange={setAccepted} />
```

## Accessibility

- `accessibilityRole="checkbox"` with `accessibilityState { checked, disabled }`; `indeterminate` reports `checked: "mixed"`.
- `invalid` only recolours the box (React Native has no invalid state for assistive technology): show the reason as visible text next to it.
- The touch target is at least 44 × 44; a disabled checkbox is dimmed and ignores presses.
