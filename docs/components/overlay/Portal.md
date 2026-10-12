# Portal

**Stability:** experimental. Not exported from the package root yet (the wiring tickets own that); import from the component folder.

`Portal` mounts content into the nearest `OverlayHost`. The host owns one stack for z-order, Android Back and the web Escape key, so popovers, tooltips, toasts and custom overlays can be layered above the screen, and above a `Modal`. The decision is recorded in ADR 0015.

## Import

```ts
import { OverlayHost, Portal, useOverlay, useOverlayAnchor, useOverlayState } from "./components/Portal/index.js";
```

## Props

```ts
interface PortalProps {
  children?: React.ReactNode;
  dismissable?: boolean;               // Back / Escape may close it through onDismiss. Default false
  onDismiss?: () => void;              // the owner unmounts the Portal
  layer?: "dropdown" | "sticky" | "overlay" | "modal" | "toast" | "tooltip"; // theme.zIndex key. Default "overlay"
  accessibilityViewIsModal?: boolean;  // iOS: VoiceOver ignores the views behind the layer
  lockScroll?: boolean;                // read by scroll containers through useOverlayState()
}

interface OverlayHostProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backHandler?: BackHandlerLike;       // root host only; default React Native's BackHandler
  keyTarget?: KeyEventTargetLike;      // root host only; default the web document
}
```

## Usage

```tsx
// Once, near the root of the app, below the providers.
<OverlayHost>
  <App />
</OverlayHost>

// Anywhere below it.
function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? (
    <Portal dismissable onDismiss={onClose} layer="modal" accessibilityViewIsModal>
      <MenuSheet />
    </Portal>
  ) : null;
}

// Imperative.
const overlay = useOverlay();
const id = overlay.open(<Toast text="Saved" />, { layer: "toast" });
overlay.close(id);

// A surface in its own native window renders its own host: its portals appear inside the window.
<RNModal visible onRequestClose={close}>
  <OverlayHost>
    <Dialog />
  </OverlayHost>
</RNModal>
```

`useOverlayAnchor(ref)` returns `{ rect, measure() }`: the window rectangle of the element behind `ref` (through `measureInWindow`), for overlays placed next to it.

## Behaviour

- **Nearest host.** The Portal registers with the nearest `OverlayHost` above it. Content is drawn by the host, above its children, in a `pointerEvents="box-none"` layer, so the screen below stays interactive.
- **Stacking.** Entries are ordered by layer, then by mount order (the later portal is on top within a layer). `zIndex` is the layer's `theme.zIndex` value plus the position in the stack.
- **Back and Escape.** The root host listens once. A press closes only the **topmost dismissable** overlay, by calling its `onDismiss`; Back is reported handled only then. Nested hosts share the root's stack.
- **Theme.** The scoped theme of the Portal's position (a `ThemeScope`) is forwarded to the content. Other contexts are not: wrap them in the content.
- **Update and cleanup.** Re-rendering the Portal updates its content; unmounting it (or its host) removes it.
- **No host.** The children are shown in React Native's `Modal` and, in development, a warning is logged.
- **Focus.** The Portal does not move focus.

## Platform matrix

| Behaviour | iOS | Android | Web |
| --- | --- | --- | --- |
| Host layer, stacking, update and cleanup | Unit-tested on the test shim; not run on a device | Unit-tested on the test shim; not run on a device | Unit-tested on the test shim; not run in a browser |
| Back closes the topmost dismissable overlay | n/a (no Back button) | Tested with a fake `BackHandler`; not run on a device | n/a |
| Escape closes the topmost dismissable overlay | n/a | n/a | Tested with a fake `document`; not run in a browser |
| `accessibilityViewIsModal` on the layer | Prop passed and tested; VoiceOver behaviour unverified | Ignored by the platform | Ignored by the platform |
| Nested host in a native-window surface | Tested with a stand-in for `Modal` (the shim has no native windows); unverified with the real `Modal` | Same | Same |
| Fallback to React Native `Modal` without a host | Tested on the shim | Tested on the shim | Tested on the shim |

Verified means exercised by `tests/components/Portal.test.tsx` against the test shim. No cell has been verified on a device or in a browser.

## Stability

Experimental (prototype). Modal, Popover, Select and Toast do not use it yet; until they do they keep their own `Modal`s and are not part of the stack.
