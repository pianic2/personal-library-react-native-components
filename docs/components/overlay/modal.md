# Modal

**Stability:** experimental — provisional API, not recommended for production dependency.

Centered blocking dialog over a themed backdrop. It wraps the React Native `Modal`, names the dialog for screen readers, dismisses from the backdrop, the Android back button and (on web) the Escape key, and animates through the motion engine.

## Import

```ts
import { Modal } from "@personal-library/react-native-components";
```

`ModalProps`, `ModalAnimationType` and `ModalInsets` are exported from `src/components/Modal`; they are not on the package root yet.

## Usage

```tsx
const [open, setOpen] = useState(false);

<Button label="Delete" onPress={() => setOpen(true)} />
<Modal visible={open} onClose={() => setOpen(false)} title="Delete file" size="sm">
  <Text>This cannot be undone.</Text>
  <Button label="Delete" onPress={() => { remove(); setOpen(false); }} />
</Modal>
```

Name the dialog with `title` (rendered as a heading) or, without a visible title, with `accessibilityLabel`. Return the screen-reader focus to the trigger with `restoreFocusRef`, and start it on the first control with `initialFocusRef`:

```tsx
<Modal visible={open} onClose={close} accessibilityLabel="Rename" initialFocusRef={nameInput} restoreFocusRef={trigger}>
  <Input ref={nameInput} />
</Modal>
```

## Props

```ts
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";            // maximum width 360 / 480 / 640, default "md"
  dismissOnBackdrop?: boolean;          // default true
  title?: string;                       // visible heading; also names the dialog
  accessibilityLabel?: string;          // spoken name, wins over title
  accessibilityDescribedBy?: string;    // nativeID of a description element (aria-describedby, web only)
  dismissLabel?: string;                // label of the backdrop dismiss button, default "Close dialog"
  animationType?: "fade" | "slide" | "none"; // default "fade"
  avoidKeyboard?: boolean;              // default false
  insets?: { top?: number; bottom?: number; left?: number; right?: number }; // safe-area insets, default 0
  initialFocusRef?: React.RefObject<unknown>;
  restoreFocusRef?: React.RefObject<unknown>;
}
```

All props added after the first release are optional: the original five (`visible`, `onClose`, `children`, `size`, `dismissOnBackdrop`) keep their meaning.

## Behavior

- **Dismissal.** `onClose` is called once for a backdrop press (only when `dismissOnBackdrop` is true), once for `onRequestClose` (Android back button) and once for the Escape key on web, which React Native Web delivers through `onRequestClose`. Pressing the dialog content never closes it.
- **Accessibility.** The dialog has `role="dialog"`, `aria-modal` and `accessibilityViewIsModal`, so screen readers stay inside it. With `title`, the heading is linked through `aria-labelledby`. The backdrop dismiss action is a separate element with `accessibilityRole="button"` and `dismissLabel`; the dialog content is not nested in it, so it is read on its own. When the dialog opens, its label is announced.
- **Focus.** `initialFocusRef` receives the screen-reader focus on open and `restoreFocusRef` on close (`AccessibilityInfo.setAccessibilityFocus`). There is no Tab focus trap on native; on web React Native Web traps focus in the modal.
- **Animation.** `fade` and `slide` (the dialog slides up) run through the motion engine and the motion tokens; the native modal stays open until the exit finishes. Under reduced motion (system setting or `MotionProvider reduceMotion="always"`) no animation is created and the change is instant. `none` follows `visible` directly.
- **Keyboard and safe area.** `avoidKeyboard` wraps the dialog in `KeyboardAvoidingView` (padding on iOS, height elsewhere). `insets` adds to the overlay padding; the component does not read a safe-area context.
- **Theme.** The backdrop is `colors.backdrop`; the dialog uses the `surface` color and `lg` radius and padding.

## Platform matrix

| Behavior | iOS | Android | Web |
| --- | --- | --- | --- |
| Backdrop press, `onRequestClose` | Test shim only (not run on a device) | Test shim only (not run on a device) | Test shim only (not run on a device) |
| Escape key | n/a (no key) | n/a | Provided by React Native Web, reaches `onRequestClose` (not run in a browser) |
| `accessibilityViewIsModal`, `role`, `aria-modal` | Props asserted in tests; VoiceOver behavior unverified | Props asserted; TalkBack unverified | `aria-modal` and `role` asserted; screen reader unverified |
| Announce on open, initial and restored focus | Through `AccessibilityInfo`, asserted with a fake host; unverified on a device | Same | Not applicable (`AccessibilityInfo` focus is a no-op) |
| Focus trap | Not implemented | Not implemented | React Native Web modal focus trap (unverified) |
| Reduced-motion instant transition | Asserted with the mocked system setting and a spy engine | Same | Same (`prefers-reduced-motion` maps to the same setting) |
| `avoidKeyboard` | Wrapper present only where `KeyboardAvoidingView` exists; keyboard behavior unverified | Same | No effect |
| `slide` and `fade` visuals | Unverified (the test shim has no `Animated`) | Unverified | Unverified |

"Asserted" means checked in `tests/components/modal.test.tsx`, which runs on the Node test shim, not on a simulator, device or browser. The shared contract page `audit/components/overlay-platform-contract-plrnui-23.md` is not updated here; this matrix is the evidence for it.

## Known limits

- `Select`, `Popover`, `Tooltip` and `BottomSheet` open their own native modal. Opening one from inside a `Modal` relies on the overlay host (see `Portal`); that integration is a separate ticket.
- `aria-describedby` has no effect on iOS and Android.
- No scroll lock, stacking order or return-focus-to-trigger fallback beyond the refs above.
