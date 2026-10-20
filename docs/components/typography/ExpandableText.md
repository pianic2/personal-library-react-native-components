# ExpandableText

**Stability:** experimental — prototype, not yet promoted; the API may change.

Text clamped to a number of lines, with a "Read more" / "Show less" toggle. The toggle is hidden when the text fits. Use `Text` with `lines` when no toggle is needed and `Collapsible` to show or hide arbitrary content.

## Import

```ts
import { ExpandableText } from "@personal-library/react-native-components";
import type { ExpandableTextProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface ExpandableTextProps {
  children: string; // the text
  numberOfLines?: number; // lines shown while collapsed, default 3
  expanded?: boolean; // controlled
  defaultExpanded?: boolean; // uncontrolled initial value, default false
  onExpandedChange?: (expanded: boolean) => void;
  moreLabel?: string; // default "Read more"
  lessLabel?: string; // default "Show less"
  size?: "sm" | "md" | "lg"; // default "md"
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
// Uncontrolled
<ExpandableText numberOfLines={3}>{review.body}</ExpandableText>

// Controlled, with translated labels
<ExpandableText expanded={open} onExpandedChange={setOpen} moreLabel="Leggi di più" lessLabel="Mostra meno">
  {description}
</ExpandableText>
```

## Behaviour

- States: collapsed, expanded, and not truncatable (the text fits in `numberOfLines`, so no toggle is shown).
- Truncation is measured on an invisible copy of the text without a line limit, so it is reliable on iOS, Android and web.
- Once expanded, the toggle stays so the text can be collapsed again.
- The toggle colour is the `action.primary` semantic token; the text uses the `Text` typography at the given `size`.

## Accessibility

- The toggle is a button with `accessibilityState.expanded` and a label equal to its visible text.
- The measuring copy is hidden from assistive technology.

## Stability

Status `prototype` (ADR 0003). The root export and the catalog wiring are added by the wave-wiring ticket.
