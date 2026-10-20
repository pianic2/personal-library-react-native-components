// src/components/DescriptionList/DescriptionList.tsx
// Label/value pairs for detail views: stacked, inline or in grid columns. Copying is delegated to the consumer (`onCopy`).

import React, { createContext, useContext } from "react";
import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { Text } from "../Text/Text.js";
import { Grid, type GridCount } from "../Grid/Grid.js";
import { useVariants } from "../../theme/useVariants.js";
import { descriptionListVariants } from "./descriptionList.variants.js";

export type DescriptionListLayout = "stacked" | "inline" | "grid";

export interface DescriptionListItemData {
  /** The term, for example "Email". */
  label: string;
  /** The description. Text or numbers are rendered as text and read as `label: value`; a node is rendered as given. */
  value: React.ReactNode;
  /** Makes the pair pressable (role button) and is called when it is pressed. Overrides the list's `onCopy`. */
  onCopy?: () => void;
  /** Accessibility hint for a copyable pair, for example "Copies the email address". */
  copyHint?: string;
  testID?: string;
}

export interface DescriptionListProps extends Omit<ViewProps, "children" | "style"> {
  /** The pairs to render. Use `DescriptionList.Item` children instead for custom composition. */
  items?: readonly DescriptionListItemData[];
  /** `stacked` (default), `inline` or `grid`. */
  layout?: DescriptionListLayout;
  /** Number of columns for the `grid` layout, or a map from breakpoint to count. Default `{ base: 1, md: 2 }`. */
  columns?: GridCount;
  /**
   * Makes every pair copyable: called with the pair's label and value when it is pressed. The library has no clipboard
   * dependency; write to the clipboard in this callback.
   */
  onCopy?: (label: string, value: React.ReactNode) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface DescriptionListItemProps extends DescriptionListItemData {
  style?: StyleProp<ViewStyle>;
}

interface ListContextValue {
  layout: DescriptionListLayout;
  onCopy?: DescriptionListProps["onCopy"];
}

const ListContext = createContext<ListContextValue | null>(null);

const isText = (value: React.ReactNode): value is string | number => typeof value === "string" || typeof value === "number";

/** One label/value pair. It is a single accessible element, so a screen reader reads the label and value together. */
function DescriptionListItem({ label, value, onCopy, copyHint, style, testID }: DescriptionListItemProps) {
  const context = useContext(ListContext);
  if (!context) throw new Error("[ui/DescriptionList] DescriptionList.Item must be rendered inside <DescriptionList>.");
  const styles = useVariants(descriptionListVariants, { layout: context.layout });
  const copy = onCopy ?? (context.onCopy ? () => context.onCopy?.(label, value) : undefined);
  const accessibilityLabel = isText(value) ? `${label}: ${value}` : undefined;
  const content = (
    <>
      <Text size="sm" style={styles.label}>
        {label}
      </Text>
      {isText(value) ? <Text style={styles.value}>{value}</Text> : <View style={context.layout === "inline" ? styles.value : undefined}>{value}</View>}
    </>
  );
  const common = { accessible: true, accessibilityLabel, testID, style: [styles.item, style] };
  if (copy) {
    return (
      <Pressable {...common} accessibilityRole="button" accessibilityHint={copyHint} onPress={copy}>
        {content}
      </Pressable>
    );
  }
  return <View {...common}>{content}</View>;
}
DescriptionListItem.displayName = "DescriptionList.Item";

/** A list of label/value pairs for detail views. Pass `items`, or compose `DescriptionList.Item` children. */
function DescriptionListRoot({ items, layout = "stacked", columns = { base: 1, md: 2 }, onCopy, style, children, ...rest }: DescriptionListProps) {
  const styles = useVariants(descriptionListVariants, { layout });
  const pairs = items ? items.map((item, index) => <DescriptionListItem key={`${item.label}-${index}`} {...item} />) : children;
  return (
    <ListContext.Provider value={{ layout, onCopy }}>
      <View {...rest} style={[layout === "grid" ? undefined : styles.root, style]}>
        {layout === "grid" ? (
          <Grid columns={columns} gap="md">
            {pairs}
          </Grid>
        ) : (
          pairs
        )}
      </View>
    </ListContext.Provider>
  );
}
DescriptionListRoot.displayName = "DescriptionList";

export const DescriptionList = Object.assign(DescriptionListRoot, { Item: DescriptionListItem });
