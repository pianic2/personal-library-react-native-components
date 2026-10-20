import React, { createContext, useCallback, useContext, useId, useMemo } from "react";
import { View, type PressableProps, type StyleProp, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { useControllableState } from "../../hooks/useControllableState.js";
import { useVariants } from "../../theme/useVariants.js";
import { Collapsible } from "../Collapsible/index.js";
import { Text } from "../Text/index.js";
import { accordionVariants } from "./accordion.variants.js";

export interface AccordionProps extends Omit<ViewProps, "children" | "style"> {
  /** `single` keeps at most one item open; `multiple` lets items open independently. Default `single`. */
  type?: "single" | "multiple";
  /** Single mode only: lets the open item be closed again. Default `false` (one item always stays open once opened). */
  collapsible?: boolean;
  /** Controlled open item(s): a string in `single` mode (`""` for none), a string array in `multiple` mode. */
  value?: string | string[];
  /** Initially open item(s) when uncontrolled, in the same shape as `value`. */
  defaultValue?: string | string[];
  /** Called with the next open item(s): a string in `single` mode, a string array in `multiple` mode. */
  onValueChange?: (value: string | string[]) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface AccordionItemProps extends Omit<ViewProps, "children" | "style"> {
  /** Identifies the item in `value`. Must be unique within the accordion. */
  value: string;
  /** Disables the header: the item cannot be toggled by the user. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface AccordionHeaderProps extends Omit<PressableProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  /** Style of the title text. */
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
  /** The title: a string is rendered as text, other nodes are rendered as given. */
  children?: React.ReactNode;
}

export interface AccordionPanelProps extends Omit<ViewProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string, open: boolean) => void;
}
interface ItemContextValue {
  value: string;
  disabled: boolean;
  open: boolean;
  headerId: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<ItemContextValue | null>(null);

function useAccordion(part: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) throw new Error(`[ui/Accordion] ${part} must be rendered inside <Accordion>.`);
  return context;
}
function useItem(part: string): ItemContextValue {
  const context = useContext(ItemContext);
  if (!context) throw new Error(`[ui/Accordion] ${part} must be rendered inside <Accordion.Item>.`);
  return context;
}

const toList = (value: string | string[] | undefined): string[] | undefined =>
  value === undefined ? undefined : Array.isArray(value) ? value : value === "" ? [] : [value];

function AccordionRoot({ type = "single", collapsible = false, value, defaultValue, onValueChange, style, children, ...rest }: AccordionProps) {
  const multiple = type === "multiple";
  const [open, setOpen] = useControllableState<string[]>({
    value: toList(value),
    defaultValue: toList(defaultValue) ?? [],
    onChange: (next) => onValueChange?.(multiple ? next : (next[0] ?? "")),
  });
  const isOpen = useCallback((item: string) => open.includes(item), [open]);
  const toggle = useCallback(
    (item: string, next: boolean) => {
      if (multiple) setOpen((current) => (next ? (current.includes(item) ? current : [...current, item]) : current.filter((v) => v !== item)));
      else if (next) setOpen([item]);
      else if (collapsible) setOpen([]);
    },
    [multiple, collapsible, setOpen]
  );
  const context = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);
  const styles = useVariants(accordionVariants);
  return (
    <AccordionContext.Provider value={context}>
      <View {...rest} style={[styles.root, style]}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ value, disabled = false, style, children, ...rest }: AccordionItemProps) {
  const { isOpen, toggle } = useAccordion("Accordion.Item");
  const headerId = useId();
  const open = isOpen(value);
  const styles = useVariants(accordionVariants);
  const item = useMemo(() => ({ value, disabled, open, headerId }), [value, disabled, open, headerId]);
  return (
    <ItemContext.Provider value={item}>
      <Collapsible {...rest} open={open} onOpenChange={(next) => toggle(value, next)} style={[styles.item, style]}>
        {children}
      </Collapsible>
    </ItemContext.Provider>
  );
}

/** The button that toggles its item: title plus a chevron, with `accessibilityState.expanded`. */
function AccordionHeader({ style, titleStyle, children, accessibilityState, ...rest }: AccordionHeaderProps) {
  const { disabled, open, headerId } = useItem("Accordion.Header");
  const styles = useVariants(accordionVariants, undefined, { disabled, open });
  return (
    <Collapsible.Trigger
      {...rest}
      nativeID={headerId}
      disabled={disabled || rest.disabled}
      accessibilityState={{ ...accessibilityState, disabled: disabled || !!rest.disabled }}
      style={[styles.header, style] as PressableProps["style"]}
    >
      {typeof children === "string" ? <Text style={[styles.title, titleStyle]}>{children}</Text> : children}
      <Text accessible={false} importantForAccessibility="no" style={styles.chevron}>
        {open ? "⌃" : "⌄"}
      </Text>
    </Collapsible.Trigger>
  );
}

/** The collapsible body of an item; labelled by the item's header. */
function AccordionPanel({ style, children, ...rest }: AccordionPanelProps) {
  const { headerId } = useItem("Accordion.Panel");
  const styles = useVariants(accordionVariants);
  return (
    <Collapsible.Content {...rest} accessibilityLabelledBy={headerId} aria-labelledby={headerId} style={[styles.panel, style]}>
      {children}
    </Collapsible.Content>
  );
}

/**
 * Group of disclosure items built on Collapsible. `type="single"` opens one item at a time (`collapsible` allows closing it),
 * `type="multiple"` opens items independently. Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`.
 */
export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Panel: AccordionPanel,
});
