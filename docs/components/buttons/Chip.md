# Chip

**Stability:** beta — public consumer API, usable but contract may still change.

A compact token for filters, multi-select values and tags. It can be selected, removed, and carry an icon or an avatar. Use `Badge` for a label that carries no action and `Button` for an action.

## Import

```ts
import { Chip } from "@personal-library/react-native-components";
import type { ChipProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface ChipProps {
  label: string; // visible text; names the chip and the remove control
  selected?: boolean; // controlled; makes the chip selectable (role checkbox)
  onSelectedChange?: (selected: boolean) => void; // next value on press; makes the chip selectable
  onPress?: (event: GestureResponderEvent) => void; // after onSelectedChange; independent of onRemove
  onRemove?: () => void; // shows the trailing remove control
  variant?: "filled" | "outline" | "soft"; // default "filled"
  size?: "sm" | "md"; // default "md"
  tone?: "primary" | "neutral" | "success" | "warning" | "danger" | "info"; // default "primary"
  leftIcon?: React.ReactNode; // decorative
  avatar?: React.ReactNode; // decorative, before leftIcon
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

The colour prop is `tone`, not `color`, and `danger` replaces `error` (ADR 0014).

## Usage

```tsx
// Filter chip
<Chip label="On sale" selected={onSale} onSelectedChange={setOnSale} />

// Input chip: a removable value
<Chip label="design" variant="outline" tone="neutral" onRemove={() => removeTag("design")} />

// With an icon, soft variant
<Chip label="Nearby" variant="soft" size="sm" leftIcon={<Icon name="search" size="sm" />} onPress={openMap} />
```

## Behaviour

- The Chip keeps no selection state: pass `selected` and update it in `onSelectedChange`.
- A selectable chip that is not selected shows a quiet look (sunken surface, default border); once selected, `tone` and `variant` colour it. A chip that is not selectable always shows `tone`.
- `onRemove` is independent of `onPress` and `onSelectedChange`: pressing the remove control calls only `onRemove`.
- `disabled` blocks every press and dims the chip with `theme.components.button.opacity.disabled`.
- Colours are semantic tokens only; the shape uses `theme.radius.full` and the spacing `theme.space`.

## Accessibility

- A selectable chip has role `checkbox` with `accessibilityState` `checked` and `selected`; a chip with only `onPress` has role `button`; a chip with neither is plain content. `disabled` is reported in the state.
- The remove control is a button labelled `Remove <label>`. Its 44pt target comes from `hitSlop`; the chip itself stays 32 or 40 high.
- `leftIcon` and `avatar` are hidden from assistive technology; put the meaning in `label`.

## Stability

Status `demo` (ADR 0003). The root export and the catalog wiring are added by the wave-wiring ticket.
