# Popover

**Stability:** experimental — provisional API, not recommended for production dependency.

A panel anchored to a trigger, on iOS, Android and web. The content is mounted into the nearest `OverlayHost` through `Portal` (ADR 0015), positioned from the trigger's `measureInWindow` rectangle, and flipped and shifted so that it stays inside the window and the safe area. It replaces the earlier behaviour where native rendered the trigger only.

## Import

```ts
import { Popover } from "@personal-library/react-native-components";
import type { PopoverProps } from "src/components/Popover"; // not on the package root yet
```

`PopoverProps` is exported from `src/components/Popover`. Render an `OverlayHost` once near the root of the app (see [Portal](Portal.md)).

## Props

```ts
type PopoverPlacement = "bottom" | "top" | "right" | "left";

interface PopoverProps {
  renderTrigger: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  placement?: PopoverPlacement;                          // preferred side, default "top"
  gap?: keyof Theme["space"];                            // distance to the trigger, default "xs"
}
```

## Usage

```tsx
<OverlayHost>
  <Popover renderTrigger={({ open, toggle }) => <Button label={open ? "Close" : "Open"} onPress={toggle} />} placement="bottom">
    <Text>Popover content</Text>
  </Popover>
</OverlayHost>
```

Call `toggle` from the trigger's own press handler. Popover no longer wraps the trigger in a `Pressable`, so a trigger that is not pressable (a plain `Text`) no longer opens it, and a pressable trigger is not nested inside another one. This is a behaviour change for code that relied on the wrapper.

## Behaviour

- **Placement.** The preferred `placement` is used when the content fits on that side. Otherwise it flips to the opposite side when that fits (or has more room), and it is shifted along the other axis to stay inside the window, the safe-area insets and a `sm` margin. The maths is the pure function `computePopoverPlacement` in `src/components/Popover/placement.ts`.
- **Measuring.** The trigger is measured with `measureInWindow` each time the popover opens and when the window size changes; the content stays invisible (opacity 0) until both the trigger and the content have been measured. If the trigger cannot be measured (a test host) the content is placed as if the trigger were at the window origin.
- **Dismissal.** A press outside (a transparent backdrop), Escape on web and Android Back close it. Escape and Back are handled by the `OverlayHost` for the topmost dismissable overlay; Popover adds no `BackHandler` subscription of its own.
- **Without a host.** `Portal` falls back to a React Native `Modal` and logs a warning in development.

## Accessibility

- The element returned by `renderTrigger` receives `accessibilityState.expanded` and `aria-expanded` (merged with any state it already has). The trigger component must forward them to its host view: the current `Button` does not forward `accessibilityState`, so use a `Pressable` (or a trigger that forwards it) when the expanded state matters to your users.
- The content has `role="dialog"` and an `accessibilityActions` entry named `dismiss` (label "Close"), so a screen-reader user can close it without finding the backdrop. The backdrop itself is hidden from assistive technology.
- When it closes, the screen-reader focus returns to the trigger.

## Platform notes

| Platform | Status |
| --- | --- |
| iOS | Renders through the OverlayHost; verified in unit tests with the test shim, not on a device. |
| Android | Same; Back closes it through the host. Not verified on a device. |
| Web | Same; Escape closes it through the host. Not verified in a browser. |

Known limits: the host is assumed to fill the window (the positions are window coordinates); the safe-area insets come from `SafeAreaInsetsProvider` (the Android status-bar fallback applies without it); `style`, `testID`, a controlled `open` and a custom dismiss label are not props yet.

## Stability

`experimental`: the behaviour above is covered by tests (`tests/components/popover.test.tsx`), but it is not yet verified on devices or in a browser, and the props listed above are the whole contract for now.
