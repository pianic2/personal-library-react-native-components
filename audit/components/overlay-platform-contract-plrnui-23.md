# PLRNUI-23 - Overlay Platform Contract

## Scope

This contract covers the overlay and modal form components copied into the current repository before PLRNUI-23:

- `Modal`: `src/components/Modal/Modal.tsx`
- `BottomSheet`: `src/components/BottomSheet/BottomSheet.tsx`
- `Tooltip`: `src/components/Tooltip/Tooltip.tsx`
- `Popover`: `src/components/Popover/Popover.tsx`
- `Select`: `src/components/Select/Select.tsx`

PLRNUI-23 adds local barrels, root API visibility, and Node render smoke coverage. It does not add runtime or native dependencies, does not add package subpath exports, and does not promote these components to `stable`.

## Platform support matrix

| Component | iOS | Android | Web | Current maturity verdict |
| --- | --- | --- | --- | --- |
| `Modal` | Supported through React Native `Modal`; dismiss/backdrop render smoke only | Supported through React Native `Modal`; dismiss/backdrop render smoke only | Supported through React Native Web `Modal` when available; full focus behavior unverified | Experimental |
| `BottomSheet` | Supported through React Native `Modal` fallback sheet; no gesture/keyboard proof | Supported through React Native `Modal` fallback sheet; no gesture/keyboard proof | Supported as modal-backed sheet in the testable source contract; web UX not validated | Experimental |
| `Tooltip` | Explicit fallback: renders children only and no tooltip surface | Explicit fallback: renders children only and no tooltip surface | Full implemented behavior: hover/press trigger with positioned tooltip content | Experimental |
| `Popover` | Explicit fallback: renders trigger only and no popover content | Explicit fallback: renders trigger only and no popover content | Full implemented behavior: trigger toggles positioned popover content | Experimental |
| `Select` | Supported through React Native `Modal` option sheet; keyboard and screen reader behavior unverified | Supported through React Native `Modal` option sheet; keyboard and screen reader behavior unverified | Supported through the same modal option sheet; desktop keyboard behavior unverified | Experimental |

## Modal contract

- Dismiss: `onRequestClose` calls `onClose`; backdrop press calls `onClose` when `dismissOnBackdrop` is `true`.
- Backdrop: `transparent` React Native modal with themed `colors.backdrop`.
- Focus: no explicit focus trap, restore-focus behavior, or initial focus management is implemented.
- Accessibility: relies on React Native `Modal` semantics; no explicit labels, roles, or described-by relationship are implemented by the component.
- Keyboard: no keyboard avoidance or escape-key handling is implemented beyond React Native `onRequestClose`.

## BottomSheet contract

- Dismiss: `onRequestClose` and backdrop press call `onClose`.
- Backdrop: `transparent` React Native modal with themed `colors.backdrop`.
- Focus: no explicit focus trap, restore-focus behavior, or initial focus management is implemented.
- Accessibility: relies on React Native `Modal` semantics; no explicit sheet role, label, or described-by relationship is implemented.
- Keyboard: no keyboard avoidance, safe area negotiation, drag gesture, or keyboard-aware snap behavior is implemented.
- Snap behavior: `snap="collapsed"` maps to `35%`; `snap="expanded"` maps to `70%`. Intermediate snaps and gestures are not implemented.

## Tooltip contract

- Web: implemented with hover and press handlers, delayed open, and positioned tooltip content.
- iOS/Android: explicit fallback renders `children` only. Tooltip content is not rendered on native.
- Focus: no keyboard focus trigger is implemented.
- Accessibility: no screen reader announcement or ARIA-like relationship is implemented.
- Stable status: not stable because native behavior is intentionally non-equivalent and keyboard/accessibility support is unverified.

## Popover contract

- Web: implemented with a press trigger, internal open state, and positioned popover content.
- iOS/Android: explicit fallback renders only `renderTrigger({ open, toggle })`. Popover content is not rendered on native.
- Focus: no focus trap, focus restoration, or outside-focus dismissal is implemented.
- Accessibility: no role, label, or expanded/controls state is implemented.
- Stable status: not stable because native behavior is intentionally non-equivalent and keyboard/accessibility support is unverified.

## Select contract

- Keyboard: no keyboard navigation, typeahead, escape handling, or focus loop is implemented.
- Screen reader: no explicit role, selected state, expanded state, listbox semantics, or announcement behavior is implemented.
- Focus: no explicit focus management or focus restoration is implemented.
- Modal/native/web behavior: trigger opens a React Native `Modal`; selecting an option calls `onChange(value)` and closes the modal; pressing the backdrop closes the modal. The same source contract is used for native and web.
- Dependency note: PLRNUI-23 removes the copied `lucide-react-native` icon import and uses existing React Native/Text primitives instead, keeping the package free of new runtime/native dependencies.

## Stable promotion verdict

Verdict: **not stable**.

PLRNUI-23 adds API visibility and render smoke coverage for the scoped components, but the stable gate remains blocked by incomplete platform validation, focus behavior, accessibility behavior, keyboard behavior, and consumer runtime evidence.

## Residual blockers

- `Modal`: explicit accessibility/focus contract and interaction coverage remain incomplete.
- `BottomSheet`: gesture, keyboard avoidance, safe area and snap interaction validation remain incomplete.
- `Tooltip`: native fallback is children-only; keyboard/focus/screen reader behavior remains incomplete.
- `Popover`: native fallback is trigger-only; keyboard/focus/screen reader behavior remains incomplete.
- `Select`: keyboard navigation, selected-state accessibility and focus restoration remain incomplete.
- All scoped components: Node render smoke coverage is present, but iOS/Android/Web runtime behavior remains unproven outside the test shim.
