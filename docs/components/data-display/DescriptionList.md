# DescriptionList

**Stability:** prototype — experimental, not yet exported from the package root.

Label/value pairs for detail screens, in a stacked, inline or grid layout. A pair can be copyable through a consumer callback; the library has no clipboard dependency.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder:

```ts
import { DescriptionList } from "./src/components/DescriptionList/index.js";
import type { DescriptionListProps } from "./src/components/DescriptionList/index.js";
```

## Props

```ts
interface DescriptionListProps extends Omit<ViewProps, "children" | "style"> {
  items?: readonly { label: string; value: React.ReactNode; onCopy?: () => void; copyHint?: string; testID?: string }[];
  layout?: "stacked" | "inline" | "grid"; // default "stacked"
  columns?: number | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", number>>; // grid only, default { base: 1, md: 2 }
  onCopy?: (label: string, value: React.ReactNode) => void; // makes every pair copyable
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode; // DescriptionList.Item elements
}

interface DescriptionListItemProps {
  label: string;
  value: React.ReactNode;
  onCopy?: () => void; // makes this pair copyable
  copyHint?: string; // accessibility hint of a copyable pair
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
<DescriptionList
  layout="inline"
  items={[
    { label: "Name", value: "Ada Lovelace" },
    { label: "Email", value: "ada@example.com", onCopy: () => Clipboard.setString("ada@example.com") },
  ]}
/>

<DescriptionList layout="grid" columns={{ base: 1, md: 3 }}>
  <DescriptionList.Item label="Status" value={<Badge>Active</Badge>} />
  <DescriptionList.Item label="Plan" value="Pro" />
</DescriptionList>
```

## Behaviour

- `stacked` puts the label above the value; `inline` puts them side by side and wraps long values onto several lines without overlapping the label; `grid` lays stacked pairs out in columns with `Grid`.
- `onCopy` on the list or on an item only calls your function; write to the clipboard there.

## Accessibility

- Each pair is a single accessible element. For text or number values its `accessibilityLabel` is `label: value`; for a node value the children are grouped and read together.
- A copyable pair has `accessibilityRole="button"` and the optional `copyHint`.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring). Colours come from semantic tokens through the `descriptionList` variants.
