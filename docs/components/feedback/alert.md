# Alert

**Stability:** beta — public consumer API, usable but contract may still change.

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
  onDismiss?: () => void;
  dismissLabel?: string; // default "Dismiss"
}
```

## Usage

```tsx
<Alert variant="error" title="Payment failed" message="Check your card and try again." onDismiss={() => setShown(false)} />

<Alert variant="success" message="Saved" actionLabel="Undo" onAction={undo} />
```

## Accessibility

- The Alert has `accessibilityRole="alert"` and an `accessibilityLiveRegion`: `assertive` for the `error` variant (the danger severity), `polite` for the others, so assistive technology announces it when it appears.
- Text and the close button use whichever of the `textInverted` and `textPrimary` tokens has the higher WCAG contrast on the variant background; the tests check at least 4.5:1 for the five variants in light and dark.
- `onDismiss` shows a close button with a 44pt touch target and `accessibilityLabel` from `dismissLabel` (default "Dismiss"). The Alert does not hide itself: the caller removes it.
- The `actionLabel` button is the ghost `Button`, whose label colour comes from the Button component, not from the Alert.
