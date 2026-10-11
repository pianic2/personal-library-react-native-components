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

## Usage

```tsx
<Switch label="Notifications" value={enabled} onChange={setEnabled} />
<Switch label="Beta features" value={false} disabled onChange={() => undefined} />
```

## Accessibility and motion

- `accessibilityRole="switch"` with `accessibilityState { checked, disabled }`; the touch target is at least 44 × 44.
- The thumb slides between the two positions using the motion tokens (`duration.fast`). Under reduced motion it jumps; without `Animated` (SSR, tests) it snaps.
