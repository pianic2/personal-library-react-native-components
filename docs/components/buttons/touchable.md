# Touchable

**Stability:** beta — public consumer API, usable but contract may still change.

The pressable primitive. It gives any content press feedback, a 44pt minimum target, hit slop, loading and disabled semantics, a web focus ring and an optional haptic, so that pressable components do not hand-roll `Pressable` styling.

## Import

```ts
import { Touchable } from "@personal-library/react-native-components";
import type { TouchableProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface TouchableProps {
  children?: ReactNode; // with asChild: the single element that becomes the pressable
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean; // no presses, feedback or haptic; dimmed with theme.components.button.opacity.disabled
  loading?: boolean; // blocks presses, accessibilityState.busy; not dimmed
  feedback?: "opacity" | "scale" | "ripple" | "none"; // default "opacity"
  minTarget?: number; // default 44; values below 44 are raised to 44
  hitSlop?: number | Insets;
  haptic?: "light" | "medium" | false; // default false; impact haptic once per accepted press
  role?: "button" | "link" | "tab" | "checkbox" | "radio" | "switch" | "menuitem"; // default "button"
  asChild?: boolean; // merge the props into the single child (Slot) instead of rendering a wrapper
  accessibilityLabel?: string; // required unless the content has text (development warning)
  selected?: boolean; // accessibilityState.selected
  checked?: boolean | "mixed"; // accessibilityState.checked
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean; focused: boolean; disabled: boolean }) => StyleProp<ViewStyle>);
  testID?: string;
}
```

## Usage

```tsx
<Touchable accessibilityLabel="Open settings" onPress={openSettings}>
  <Icon name="settings" />
</Touchable>

<Touchable feedback="scale" haptic="light" onPress={like}>
  <Text>Like</Text>
</Touchable>

<Touchable loading={saving} onPress={save} style={({ pressed }) => ({ backgroundColor: pressed ? "transparent" : undefined })}>
  <Text>Save</Text>
</Touchable>

// Make an existing element pressable without a wrapper
<Touchable asChild role="link" onPress={open}>
  <View accessibilityHint="Opens the article"><Text>Read more</Text></View>
</Touchable>
```

## Behaviour

- Feedback comes from `usePressFeedback` and follows the reduced-motion preference. `opacity` dims to `theme.components.button.opacity.pressed` (when that is below 1, otherwise 0.85); `scale` shrinks to `theme.motion.scale.press`; `ripple` is the Android ripple and falls back to `opacity` on iOS and web; `none` has no feedback.
- `disabled` and `loading` both block `onPress` and `onLongPress`, switch the feedback and the haptic off; only `disabled` dims the content.
- `haptic` runs `impact` through the `haptics` capability (a no-op without an adapter) once per accepted press, before `onPress`.
- With `asChild` the child receives the merged props and a static pressed style; the child must be pressable for the handlers to fire.
- On web a focus ring in `colors.primary` is drawn for keyboard focus (`:focus-visible`).

## Accessibility

- `role` maps to `accessibilityRole`; `accessibilityState` reports `disabled`, `busy`, `selected` and `checked`.
- The target is at least 44x44 (`minHeight`, `minWidth`); `hitSlop` adds touch area around it.
- Without an `accessibilityLabel` and without a text child a development warning is logged.
