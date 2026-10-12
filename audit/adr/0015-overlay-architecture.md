# ADR 0015: Overlay architecture

## Status

Accepted (2026-10-12). Implements decision D4 of `audit/texo-v1/DECISIONS.md` (ADR-R3): single owner E6-01 (PLRNUI-224), nearest-host Portal, native-window surfaces mount their own host, one stack for z-order, focus and Back.

## Context

Overlays used React Native's `Modal` directly (Modal, BottomSheet, Select). There was no shared stack, no z-order between overlays, no coordinated Back or Escape handling and no scrim coordination, and a toast or popover could not render above an open `Modal`, because `Modal` is a separate native window that nothing in the root view tree can cover.

## Decision

1. **A single owner.** `src/components/Portal` owns the overlay machinery: `OverlayHost`, `Portal`, `useOverlay`, `useOverlayAnchor`, the stack store and the Back/Escape subscription. Other components (Modal, Popover, Select, Toast) adopt it in their own tickets and do not implement their own stack.
2. **A View-based layer, no native library.** `OverlayHost` renders its children and, above them, an absolutely positioned `pointerEvents="box-none"` layer holding one View per open overlay, with `zIndex` from `theme.zIndex` plus the position in the stack.
3. **Nearest-host lookup.** A `Portal` mounts into the nearest `OverlayHost` found through context, not into the root. React Native has no `createPortal`: the host renders the content, outside the Portal's own context. The Portal therefore forwards the scoped theme explicitly (the `ThemeContext` of its position, so a Portal inside a `ThemeScope` shows the scoped theme). Other contexts are not forwarded; wrap them in the content.
4. **Native-window surfaces render their own host.** `Modal` and any other surface that opens a separate native window renders an `OverlayHost` inside its window. A Portal mounted below it (a Select list, a toast) then renders inside that window, above the modal's content. A nested host shares the root host's store.
5. **One stack.** The root host creates the store; nested hosts reuse it. The stack orders entries by `theme.zIndex` layer, then by mount order, so toasts and tooltips stay above modals. The root host alone listens for Android `BackHandler` `hardwareBackPress` and the web `keydown` Escape, and both call `dismissTop`: it calls `onDismiss` of the **topmost dismissable** entry and no other, and reports whether one was found (Back is "handled" only then).
6. **Closing is the owner's job.** Back and Escape call `onDismiss`; the owner unmounts the Portal. The stack never removes an entry on its own.
7. **Focus and scroll.** The Portal does not move focus; the opener returns focus when it closes the overlay. `accessibilityViewIsModal` marks a layer modal on iOS. `lockScroll` is recorded on the entry and read through `useOverlayState()` by scroll containers; the host does not scroll-lock anything itself.
8. **Fallback.** Without a host, `Portal` shows its children in React Native's `Modal` and logs a development warning. `Modal` stays the right tool only for true modal surfaces that need native focus trapping.
9. **TexoProvider.** The root host is rendered by `TexoProvider` (D2) inside all providers. That provider does not exist yet; until it does an app renders `OverlayHost` itself, below its providers.

## Consequences

- Popover, Tooltip, Select, BottomSheet and Toast move to Portal in their own tickets; until then they keep their own `Modal`s and do not take part in the stack.
- A test that needs a native window uses a stand-in (`Modal` containing an `OverlayHost`) because the test shim has no native windows.
- `Portal` content re-renders when the Portal re-renders, not when the host does.

## Related Jira issues

- PLRNUI-224 (E6-01)
