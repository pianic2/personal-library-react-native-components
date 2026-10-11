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
  disabled?: boolean; // this option only
}

interface RadioGroupProps {
  value?: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean; // every option
  accessibilityLabel?: string; // names the group
}
```

## Usage

```tsx
<RadioGroup
  accessibilityLabel="Plan"
  value={plan}
  onChange={setPlan}
  options={[
    { label: "Free", value: "free" },
    { label: "Pro", value: "pro" },
    { label: "Team (soon)", value: "team", disabled: true },
  ]}
/>
```

## Accessibility

- The group has `accessibilityRole="radiogroup"` and the optional `accessibilityLabel`.
- Each option has `accessibilityRole="radio"` and `accessibilityState { selected, checked }`; a disabled option (or any option of a disabled group) also reports `disabled: true` and ignores presses. `disabled` is only present when it is true.
