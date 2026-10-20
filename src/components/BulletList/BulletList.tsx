// src/components/BulletList/BulletList.tsx
// Semantic list typography: bulleted, numbered, checklist or plain content, with nesting up to three levels.

import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "../Text/Text.js";
import { defineVariants } from "../../theme/variants.js";
import { useVariants } from "../../theme/useVariants.js";
import { useTheme } from "../../theme/useTheme.js";

export type BulletListType = "bullet" | "number" | "check" | "none";
type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

const MAX_DEPTH = 3;
const BULLETS = ["•", "◦", "▪"] as const;

// Styling comes from the variants API (E2-06) and semantic tokens only.
const listVariants = defineVariants(
  (t) => ({
    slots: ["root", "row", "marker", "content"],
    base: {
      root: { alignSelf: "stretch" },
      row: { flexDirection: "row", alignItems: "flex-start", gap: t.space.sm },
      marker: { minWidth: t.space.lg, color: t.semantic.text.secondary },
      content: { flex: 1, flexShrink: 1 },
    },
    variants: {},
    defaultVariants: {},
  }),
  { name: "bullet-list" }
);

interface ListContextValue {
  type: BulletListType;
  depth: number;
  start: number;
  marker?: React.ReactNode;
  gap: SpaceKey;
}
const ListContext = React.createContext<ListContextValue | null>(null);
const ItemPositionContext = React.createContext<{ index: number; count: number }>({ index: 0, count: 1 });

export interface BulletListProps {
  /** Marker style: bullets, 1. 2. 3., check boxes or none. Default `bullet`. */
  type?: BulletListType;
  /** Space between items, a `theme.space` key. Default `xs`. */
  gap?: SpaceKey;
  /** First number of a `number` list. Default 1. */
  start?: number;
  /** A custom marker for every item; replaces the default marker of `type`. */
  marker?: React.ReactNode;
  /** `BulletList.Item` elements. A nested `BulletList` inside an item is indented, up to three levels. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BulletListItemProps {
  /** Text, or any content such as a nested `BulletList`. */
  children?: React.ReactNode;
  /** Marks a `check` list item as done. Default false. */
  checked?: boolean;
  /** Replaces the list marker for this item only. */
  marker?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function BulletListItem({ children, checked = false, marker, style, testID }: BulletListItemProps) {
  const ctx = React.useContext(ListContext);
  const { index, count } = React.useContext(ItemPositionContext);
  const styles = useVariants(listVariants, {});
  const { theme } = useTheme();
  if (!ctx) throw new Error("BulletList.Item must be rendered inside a BulletList");

  let mark: React.ReactNode = marker ?? ctx.marker;
  if (mark === undefined) {
    if (ctx.type === "number") mark = `${ctx.start + index}.`;
    else if (ctx.type === "check") mark = checked ? "☑" : "☐";
    else if (ctx.type === "bullet") mark = BULLETS[Math.min(ctx.depth, MAX_DEPTH) - 1];
  }
  const hasMarker = ctx.type !== "none" || marker !== undefined || ctx.marker !== undefined;
  const plain = typeof children === "string" || typeof children === "number";
  // Native has no list roles on every version, so the label carries the position as a fallback.
  const label = plain ? `item ${index + 1} of ${count}: ${String(children)}` : `item ${index + 1} of ${count}`;

  return (
    <View
      testID={testID}
      role="listitem"
      accessibilityLabel={plain ? label : undefined}
      accessibilityHint={plain ? undefined : label}
      accessibilityState={ctx.type === "check" ? { checked } : undefined}
      style={[styles.row, index > 0 ? { marginTop: theme.space[ctx.gap] } : null, style]}
    >
      {hasMarker ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {typeof mark === "string" || typeof mark === "number" ? (
            <Text variant="muted" align="right" style={styles.marker}>
              {mark}
            </Text>
          ) : (
            mark
          )}
        </View>
      ) : null}
      <View style={styles.content}>
        {plain ? <Text>{children}</Text> : React.Children.map(children, (child) => (typeof child === "string" ? <Text>{child}</Text> : child))}
      </View>
    </View>
  );
}

function BulletListRoot({ type = "bullet", gap = "xs", start = 1, marker, children, style, testID }: BulletListProps) {
  const parent = React.useContext(ListContext);
  const styles = useVariants(listVariants, {});
  const { theme } = useTheme();
  const depth = Math.min((parent?.depth ?? 0) + 1, MAX_DEPTH);
  const value = React.useMemo(() => ({ type, depth, start, marker, gap }), [type, depth, start, marker, gap]);
  const items = React.Children.toArray(children);

  return (
    <ListContext.Provider value={value}>
      <View
        testID={testID}
        role="list"
        accessibilityRole="list"
        style={[styles.root, parent ? { paddingLeft: theme.space.md, marginTop: theme.space[parent.gap] } : null, style]}
      >
        {items.map((child, index) => (
          <ItemPositionContext.Provider key={(child as React.ReactElement).key ?? index} value={{ index, count: items.length }}>
            {child}
          </ItemPositionContext.Provider>
        ))}
      </View>
    </ListContext.Provider>
  );
}

export const BulletList = Object.assign(BulletListRoot, { Item: BulletListItem });
