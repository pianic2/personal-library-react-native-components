# BulletList

**Stability:** experimental — not yet exported from the package root; the API may change.

Semantic list typography for legal, onboarding and help content: bulleted, numbered, checklist or plain items, with nested lists and a custom marker. Use `P` for a single paragraph.

## Import

```ts
import { BulletList } from "@personal-library/react-native-components";
import type { BulletListProps } from "@personal-library/react-native-components";
```

## Props

```ts
interface BulletListProps {
  type?: "bullet" | "number" | "check" | "none"; // default "bullet"
  gap?: SpaceKey; // theme.space key between items, default "xs"
  start?: number; // first number of a "number" list, default 1
  marker?: React.ReactNode; // custom marker for every item
  children?: React.ReactNode; // BulletList.Item elements
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface BulletListItemProps {
  children?: React.ReactNode; // text, or a nested BulletList
  checked?: boolean; // check lists only, default false
  marker?: React.ReactNode; // overrides the list marker for this item
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
<BulletList>
  <BulletList.Item>Read the terms</BulletList.Item>
  <BulletList.Item>Accept to continue</BulletList.Item>
</BulletList>

<BulletList type="number" start={3}>
  <BulletList.Item>Third step</BulletList.Item>
  <BulletList.Item>Fourth step</BulletList.Item>
</BulletList>

<BulletList type="check" gap="sm">
  <BulletList.Item checked>Create an account</BulletList.Item>
  <BulletList.Item>Verify your email</BulletList.Item>
</BulletList>

<BulletList>
  <BulletList.Item>
    Parent
    <BulletList>
      <BulletList.Item>Child</BulletList.Item>
    </BulletList>
  </BulletList.Item>
</BulletList>

<BulletList marker="→">
  <BulletList.Item>Custom marker</BulletList.Item>
</BulletList>
```

## Behaviour

- Nesting: a `BulletList` inside an item is indented and uses the next bullet glyph, up to three levels; deeper lists keep the third level.
- Numbering: `start` sets the first number; each nested numbered list starts again from its own `start`.
- Styling uses `theme.space` and the secondary text token for markers; no new tokens.

## Accessibility

- The container has `role="list"` and each item `role="listitem"`.
- On native each item gets an `accessibilityLabel` of the form "item N of M: text" (a hint "item N of M" when the content is not plain text).
- Markers are hidden from assistive technology; a check item sets `accessibilityState.checked`.
