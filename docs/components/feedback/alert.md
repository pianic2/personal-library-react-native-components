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
  appearance?: "solid" | "soft" | "outline"; // default "solid"
  icon?: React.ReactNode; // decorative, hidden from assistive technology
  actions?: React.ReactNode; // extra controls after the actionLabel button
}
```

## Usage

```tsx
<Alert variant="error" title="Payment failed" message="Check your card and try again." onDismiss={() => setShown(false)} />

<Alert variant="success" message="Saved" actionLabel="Undo" onAction={undo} />

<Alert variant="warning" appearance="soft" icon={<Icon name="alert" />} title="Disk almost full" actions={<Button label="Details" variant="ghost" size="sm" onPress={showDetails} />} />

<Alert variant="info" appearance="outline" message="A new version is available" />
```

## Appearance

- `solid` (default) fills with the variant colour; the text uses whichever of `textInverted` and `textPrimary` has the higher contrast on it.
- `soft` draws the surface colour with a 12 % tint of the variant colour (a non-interactive, rounded layer behind the content; the root does not clip, so the close button keeps its full hit area); the text is `textPrimary`.
- `outline` has no fill: a 1 px border in the variant colour on the page; the text is `textPrimary`.
- The tests check the text of every variant and appearance against its effective background at 4.5:1 in light and dark. The outline border is decoration, not a control boundary, and the `warning` border is only about 2:1 on a white page: the severity is carried by the role, the live region and the text, never by the colour alone.

## Accessibility

- The Alert has `accessibilityRole="alert"` and an `accessibilityLiveRegion`: `assertive` for the `error` variant (the danger severity), `polite` for the others, so assistive technology announces it when it appears.
- Text and the close button use whichever of the `textInverted` and `textPrimary` tokens has the higher WCAG contrast on the variant background; the tests check at least 4.5:1 for the five variants in light and dark.
- `onDismiss` shows a close button with a 44pt touch target and `accessibilityLabel` from `dismissLabel` (default "Dismiss"). The Alert does not hide itself: the caller removes it.
- Without `actions` the `actionLabel` button is laid out exactly as before (full width under the text); with `actions`, the button and the extra controls share one wrapping row.
- The `icon` is decorative (`accessibilityElementsHidden`); put the meaning in the text. `actions` is rendered after the `actionLabel` button in a wrapping row; the caller supplies controls with their own labels.
- The `actionLabel` button is the ghost `Button`, whose label colour comes from the Button component, not from the Alert.
