# CircularProgress

**Stability:** prototype — experimental, not yet exported from the package root.

A ring progress indicator for goals and loading. It is drawn with two clipped half-circle Views, so it needs no svg library and no native module. It takes the same 0–100 value, tones and accessibility contract as `ProgressBar`.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder:

```ts
import { CircularProgress } from "./src/components/CircularProgress/index.js";
import type { CircularProgressProps } from "./src/components/CircularProgress/index.js";
```

## Props

```ts
interface CircularProgressProps {
  progress?: number; // 0-100, clamped; undefined or not finite renders an empty ring
  indeterminate?: boolean; // rotating segment; progress is ignored
  size?: "xs" | "sm" | "md" | "lg"; // diameter 20 / 32 / 48 / 64, default "md"
  thickness?: number; // ring width in points, default a tenth of the diameter (at least 2)
  tone?: "primary" | "info" | "success" | "warning" | "danger"; // default "primary"
  label?: React.ReactNode; // centre content; strings and numbers use Text
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
<CircularProgress progress={72} label="72%" tone="success" />
<CircularProgress indeterminate size="sm" accessibilityLabel="Loading results" />
```

## Behaviour

- Determinate: the arc is two half rings, each clipped to its side and rotated by the value; the track is the border colour.
- Indeterminate: a ring segment rotates with `Animated.timing` inside `Animated.loop` (through the motion engine) with `useNativeDriver: true` (off on web, where the native driver does not exist). Under reduced motion it is a static segment.
- No svg import. A smooth svg variant would be an optional renderer added by a later ticket (E7-25), not part of core.

## Accessibility

- `accessibilityRole="progressbar"` with `accessibilityValue {min: 0, max: 100, now}` (clamped).
- Indeterminate: `accessibilityState {busy: true}` and no value.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring). Colours come from the `circularProgress` variants and semantic tokens only.
