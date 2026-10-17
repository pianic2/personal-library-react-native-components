# BottomSheet

**Stability:** experimental — provisional API, not recommended for production dependency.

Panel that slides up from the bottom edge. It snaps to configurable heights, can be dragged by its handle, and closes with Android Back, the web Escape key, a backdrop press or a drag past the threshold. It is built on the overlay stack (`OverlayHost` and `Portal`, ADR 0015) and needs no native dependency.

## Import

```ts
import { BottomSheet } from "@personal-library/react-native-components";
```

`BottomSheetProps`, `resolveSnap`, `resolveSnapHeights`, `createPanResponderDriver` and the gesture types are exported from `src/components/BottomSheet`; they are not on the package root yet. Render an `OverlayHost` near the root of the app: it owns Back and Escape. Without one the sheet falls back to a React Native `Modal` (Back works through `onRequestClose`, Escape is not handled).

## Props

```ts
interface BottomSheetProps {
  open?: boolean;                      // controlled
  defaultOpen?: boolean;               // default false
  onOpenChange?: (open: boolean) => void; // called with false once per dismissal
  visible?: boolean;                   // @deprecated alias of open
  onClose?: () => void;                // @deprecated alias, called together with onOpenChange(false)
  snapPoints?: readonly (number | `${number}%` | "content")[]; // ascending, default ["35%", "70%"]
  snapIndex?: number;                  // controlled snap
  defaultSnapIndex?: number;           // default: the last snap point
  onSnapIndexChange?: (index: number) => void;
  snap?: "collapsed" | "expanded";     // original API: first / second of the default snap points
  header?: React.ReactNode;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;         // default true
  dismissLabel?: string;               // backdrop button label, default "Close sheet"
  accessibilityLabel?: string;         // name of the dialog
  handleLabel?: string;                // default "Drag handle"
  closeActionLabel?: string;           // screen-reader action on the handle, default "Close sheet"
  gestureDriver?: GestureDriver;       // replaces the PanResponder drag
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
const [open, setOpen] = useState(false);
const [snap, setSnap] = useState(0);

<Button label="Filters" onPress={() => setOpen(true)} />
<BottomSheet
  open={open}
  onOpenChange={setOpen}
  snapPoints={[240, "50%", "content"]}
  snapIndex={snap}
  onSnapIndexChange={setSnap}
  accessibilityLabel="Filters"
>
  <Text>Sheet content</Text>
</BottomSheet>
```

The original API keeps working: `<BottomSheet visible={v} onClose={close} snap="collapsed">`.

Snap points are heights: pixels, a share of the window (`"50%"`) or `"content"` (the measured content). `snapPoints` must be ascending after resolution; invalid entries are dropped. `resolveSnap({ heights, currentHeight, velocity })` decides where a released drag ends and is exported for tests and custom drivers.

## Behavior

- **Dismissal.** Back, Escape, a backdrop press and a drag that ends below half of the lowest snap (or a downward fling from the lowest snap, velocity at least 0.5 px/ms) each call `onOpenChange(false)` once. The sheet does not close itself when `open` is controlled: update `open` in `onOpenChange`.
- **Drag.** The handle is dragged with `PanResponder` and an animated translation (motion tokens, instant under reduced motion). A release goes to the nearest snap; a fling goes to the next snap in its direction. With a controlled `snapIndex` the sheet returns to the current index until the owner passes the new one.
- **Gesture driver.** `gestureDriver` replaces `PanResponder` (for example an adapter over react-native-gesture-handler). Only the interface exists in the core: `createHandlers({ onStart, onMove, onEnd })` returns the props spread on the handle.
- **Accessibility.** The sheet is a `dialog` with `aria-modal` and `accessibilityViewIsModal`; the backdrop is a button named by `dismissLabel`; the handle offers a screen-reader action (`closeActionLabel`) that closes the sheet.
- **Limitation.** Only the handle is draggable, so a `ScrollView` in the content does not compete with the sheet drag. Dragging the content itself is not supported.

## Platform matrix

| Behavior | iOS | Android | Web |
| --- | --- | --- | --- |
| Back / Escape through the root `OverlayHost` | n/a | Asserted with a `BackHandler` mock; not run on a device | Escape asserted with a key target mock; not run in a browser |
| Backdrop press, drag, snapping | Asserted on the Node test shim (gesture driver and callbacks); not run on a device | Same | Same |
| Animated translation | Unverified (the test shim has no `Animated`) | Unverified | Unverified |
| `accessibilityViewIsModal`, `role="dialog"` | Props asserted; VoiceOver unverified | Props asserted; TalkBack unverified | Props asserted; screen reader unverified |

## Stability

`prototype` in the component metadata (`BottomSheet.meta.ts`); promotion to `demo` needs `docs/maturity.md` to be regenerated, which this ticket does not own. The API may still change before 1.0. Behavior change for existing consumers: the sheet is rendered through the overlay stack instead of a native `Modal`, and the two snaps are now 35% and 70% of the window height as pixel values.
