# Spinner

**Stability:** beta — public consumer API, usable but contract may still change.

Spinner basato su `ActivityIndicator`.

## Import

```ts
import { Spinner } from "@personal-library/react-native-components";
```

## Props

```ts
type Size = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: Size; // default "md"
  accessibilityLabel?: string; // default "Loading"
}
```

## Usage

```tsx
<Spinner />
<Spinner size="lg" accessibilityLabel="Loading your library" />
```

## Accessibility

- The spinner has `accessibilityRole="progressbar"`, `accessibilityState.busy = true` and an `accessibilityLabel` (default `"Loading"`).

## Platform notes

- iOS ignores numeric sizes: `sm` and `md` map to `"small"`, `lg` to `"large"`. Android and web use 16, 24 and 32.
