# Screen

**Stability:** beta — public consumer API, usable but contract may still change.

Page root for a screen: themed background, safe-area padding for the edges you choose, a header slot, a static or scrolling body, a sticky footer, optional keyboard avoidance and the themed status bar. One import replaces the repeated safe area + scroll view + keyboard-avoiding view stack. `ThemeAppShell` is left unchanged.

## Import

```ts
import { Screen, useScreenInsets } from "@personal-library/react-native-components";
import type { ScreenProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface ScreenProps {
  children?: ReactNode;
  scroll?: boolean; // body in a ScrollView instead of a View, default false
  edges?: readonly ("top" | "bottom" | "left" | "right")[]; // edges padded by the insets, default all four
  padding?: SpaceKey; // theme.space key, applied to the body only
  bg?: ColorKey; // theme.colors key, default "background"
  keyboardAvoiding?: boolean; // default false
  dismissKeyboardOnTapOutside?: boolean; // default false
  statusBar?: "auto" | "light" | "dark"; // default "auto"
  refreshing?: boolean; // default false
  onRefresh?: () => void; // enables pull-to-refresh (needs scroll)
  refreshAccessibilityLabel?: string; // default "Refresh"
  header?: ReactNode; // above the body, outside the scroll content
  footer?: ReactNode; // sticky below the body, outside the scroll content
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function useScreenInsets(): { top: number; right: number; bottom: number; left: number };
```

## Usage

```tsx
// A form screen: scrolling body, sticky footer above the keyboard
<Screen scroll padding="md" keyboardAvoiding dismissKeyboardOnTapOutside footer={<Button label="Save" onPress={save} />}>
  <Input value={name} onChangeText={setName} />
</Screen>

// Pull to refresh
<Screen scroll refreshing={loading} onRefresh={reload}>
  <Text>Feed</Text>
</Screen>

// Insets applied by the Screen, for children that draw edge to edge
function Banner() {
  const { top } = useScreenInsets();
  return <View style={{ height: 120 + top }} />;
}
```

Provide real insets once at the app root with `SafeAreaInsetsProvider` (adapter from `createSafeAreaContextAdapter`). Without it the insets fall back to zero.

## Behaviour

- Insets: `edges` selects which insets are applied as padding on the frame holding header, body and footer. Edges not listed get no padding. `useScreenInsets()` returns what the nearest Screen applies (zeros outside a Screen).
- Body: `scroll` swaps the static `View` for a `ScrollView`; `padding` and `contentContainerStyle` apply to the body, never to the header or the footer. The footer is rendered after the scroll view, so it stays visible while the body scrolls.
- Keyboard: with `keyboardAvoiding` the frame sits in a `KeyboardAvoidingView` (`padding` on iOS, `height` on Android, none on web) and the bottom inset is dropped while the keyboard is open, so the footer rests on the keyboard. Without it the scroll body uses the native iOS keyboard inset adjustment instead.
- `dismissKeyboardOnTapOutside` wraps the body so that pressing empty space calls `Keyboard.dismiss`; children that handle their own press are unaffected, and the scroll view uses `keyboardShouldPersistTaps="handled"`.
- Status bar: `auto` follows the theme mode, `light` forces light content (for dark backgrounds), `dark` forces dark content. On targets without a `StatusBar` nothing is rendered.
- Pull to refresh needs `scroll` and `onRefresh`; hosts without a `RefreshControl` (web shims) ignore it.

### Platform matrix

| Behaviour | iOS | Android | Web |
| --- | --- | --- | --- |
| Insets from adapter | tested with a mock adapter, not on device | tested with a mock adapter, not on device | CSS `env(safe-area-inset-*)` without adapter, not verified in a browser |
| Keyboard avoidance | `padding`, not verified on device | `height`, not verified on device | no `KeyboardAvoidingView`, browser handles it |
| Pull to refresh | not verified on device | not verified on device | not supported |

## Accessibility

Screen adds no role and does not trap focus. Header, body and footer are rendered in reading order. The refresh control has an accessibility label (`refreshAccessibilityLabel`).

## Stability

`beta`. Maturity of the component in the catalog: demo.
