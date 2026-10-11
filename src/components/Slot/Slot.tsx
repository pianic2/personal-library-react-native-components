import React from "react";
import type { ReactElement, Ref } from "react";
import type { GestureResponderEvent, ViewProps } from "react-native";
import { useMergedRefs } from "../../hooks/useMergedRefs.js";

/**
 * The props a `Slot` forwards to its child. `onPress` and `onLongPress` are listed explicitly because `ViewProps`
 * has no press handlers; they only fire when the child itself is pressable.
 */
export type SlotProps = ViewProps & {
  children: ReactElement;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
};

type AnyProps = Record<string, unknown>;

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

const isHandlerName = (name: string): boolean => /^on[A-Z]/.test(name);

function flattenStyle(style: unknown, out: unknown[]): unknown[] {
  if (Array.isArray(style)) for (const entry of style) flattenStyle(entry, out);
  else if (style !== undefined && style !== null && style !== false) out.push(style);
  return out;
}

/**
 * Merges the props a `Slot` received (`slotProps`) into the props of its child (`childProps`).
 *
 * - `style`: both sides are concatenated into one flat array, slot first, child last, so the child wins.
 * - `on*` handlers: when both sides define one it is chained, child first and then slot; otherwise the one defined.
 * - `accessibilityState` / `accessibilityValue`: the objects are merged key by key, child wins per key.
 * - every other `accessibility*` / `aria-*` prop: the child wins unless its value is `undefined`.
 * - any other prop: the child wins unless its value is `undefined`.
 *
 * `ref` and `children` are not merged here; `Slot` merges the refs itself.
 */
export function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps };
  for (const name of Object.keys(childProps)) {
    const slotValue = slotProps[name];
    const childValue = childProps[name];
    if (name === "style") {
      merged.style = flattenStyle(childValue, flattenStyle(slotValue, []));
    } else if (isHandlerName(name) && typeof slotValue === "function" && typeof childValue === "function") {
      merged[name] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => unknown)(...args);
        (slotValue as (...a: unknown[]) => unknown)(...args);
      };
    } else if (
      (name === "accessibilityState" || name === "accessibilityValue") &&
      typeof slotValue === "object" && slotValue !== null &&
      typeof childValue === "object" && childValue !== null
    ) {
      merged[name] = { ...(slotValue as AnyProps), ...(childValue as AnyProps) };
    } else if (childValue !== undefined || !(name in slotProps)) {
      // accessibility* / aria-* and every other prop share the rule "child wins unless undefined"
      merged[name] = childValue;
    }
  }
  return merged;
}

function describeInvalid(children: unknown): string | null {
  if (!React.isValidElement(children)) {
    return Array.isArray(children)
      ? "received more than one child"
      : "received a child that is not a React element";
  }
  if (children.type === React.Fragment) return "received a Fragment, which cannot take props or a ref";
  return null;
}

/**
 * Merges its own props into its single child element instead of rendering a wrapper (the `asChild` pattern).
 *
 * The child must be exactly one valid element and not a Fragment. In `__DEV__` anything else throws a descriptive
 * error; in production nothing is rendered. Handlers such as `onPress` only fire if the child itself is pressable.
 */
export function Slot(props: SlotProps & { ref?: Ref<unknown> }): ReactElement | null {
  const { children, ref, ...slotProps } = props;
  const invalid = describeInvalid(children);
  const childRef = invalid === null ? ((children as unknown as { props: { ref?: Ref<unknown> } }).props.ref) : undefined;
  const mergedRef = useMergedRefs<unknown>(ref, childRef);
  if (invalid !== null) {
    if (isDev()) throw new Error(`[ui/Slot] Slot expects exactly one valid React element as its child but ${invalid}.`);
    return null;
  }
  const child = children as ReactElement<AnyProps>;
  const { ref: _ignoredRef, ...childProps } = child.props as AnyProps;
  return React.cloneElement(child, { ...mergeProps(slotProps as AnyProps, childProps), ref: mergedRef } as AnyProps);
}
