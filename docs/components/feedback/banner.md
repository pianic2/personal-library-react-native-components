# Banner

**Stability:** beta — public consumer API, usable but contract may still change.

A persistent, full-width announcement for a page or a section: offline, update available, trial ending. Use `Alert` for a message inside the page flow.

## Import

```ts
import { Banner } from "@personal-library/react-native-components";
import type { BannerProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface BannerProps {
  tone?: "neutral" | "info" | "success" | "warning" | "danger"; // default "info"
  title?: string;
  message?: string;
  icon?: React.ReactNode; // decorative, hidden from assistive technology
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode; // extra controls after the actionLabel button
  dismissible?: boolean; // default: true when onDismiss is set
  onDismiss?: (dismissKey?: string) => void;
  dismissKey?: string; // passed to onDismiss; the Banner stores nothing
  dismissLabel?: string; // default "Dismiss"
  position?: "inline" | "sticky"; // default "inline"
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
<Banner tone="warning" title="You are offline" message="Changes will sync when you reconnect." />

<Banner tone="info" message="A new version is available" actionLabel="Update" onAction={update} onDismiss={() => setShown(false)} />

// Remember the dismissal in your own storage; the Banner has no storage dependency
<Banner tone="success" message="Trial ends in 3 days" dismissKey="trial-banner" onDismiss={(key) => save(key)} />

<Banner position="sticky" tone="danger" message="Payment failed" />
```

## Behaviour

- Dismiss: the close button shows when `onDismiss` is set (or `dismissible` is true). Pressing it hides the Banner and calls `onDismiss(dismissKey)`. To keep it hidden across launches, the app stores the key (for example in its own storage) and does not render the Banner again; the Banner imports no storage or native module.
- `position="sticky"`: on web the Banner uses `position: sticky` at the top; on native, which has no sticky, it is pinned to the top of its parent (give the parent a position, for example a screen container). Both use the `sticky` z-index token.
- Safe area: a sticky Banner adds the top inset from a mounted `SafeAreaInsetsProvider` to its top padding. Without a provider it adds nothing. An inline Banner never adds the inset.
- Platform matrix: iOS, Android and web render paths are covered by the render tests; none is verified on a device yet, and the web `sticky` versus native absolute difference is intentional and documented here.

## Accessibility

- `warning` and `danger` use `role="alert"` (and `accessibilityRole="alert"`); `neutral`, `info` and `success` use `role="status"` (React Native has no `status` accessibilityRole, so `role` carries it). The live region is `assertive` for `danger` and `polite` for the others.
- The close button has a 44pt touch target and `accessibilityLabel` from `dismissLabel` (default "Dismiss").
- The `icon` is decorative (`accessibilityElementsHidden`); put the meaning in the text. The tone is shown by a left border next to the `sunken` surface, with `textPrimary` text, so severity never relies on colour alone.
