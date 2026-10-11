// src/responsive/Show.tsx
//
// <Show> and <Hide>: render children by breakpoint and/or window size class. Children are unmounted when hidden (not
// `display: none`) unless `keepMounted` is set.
//
// Web / hydration: the breakpoint comes from the window size, which a server render does not have. There is NO
// hydration-mismatch guard: if server and client windows differ, the first client render can differ from the markup the
// server produced. Render these components only on the client (after mount), or give the server a fixed size through
// `ResponsiveProvider window={...}`, when that matters.
import React from "react";
import { View } from "react-native";
import { useBreakpointInfo, type Breakpoint } from "../hooks/useBreakpoint.js";
import { useWindowSizeClass, type SizeClass } from "./useWindowSizeClass.js";

const ORDER: readonly Breakpoint[] = ["base", "sm", "md", "lg", "xl"];
const rank = (bp: Breakpoint): number => ORDER.indexOf(bp);

export interface ShowCondition {
  /** True from this breakpoint upwards (`above="md"` is md, lg and xl). */
  above?: Breakpoint;
  /** True below this breakpoint (`below="md"` is base and sm). */
  below?: Breakpoint;
  /** True only at exactly this breakpoint, or at any of these. */
  at?: Breakpoint | readonly Breakpoint[];
  /** Alias of `at`. */
  only?: Breakpoint | readonly Breakpoint[];
  /** True only for this width size class, or any of these (compact / medium / expanded). */
  sizeClass?: SizeClass | readonly SizeClass[];
}

export interface ShowProps extends ShowCondition {
  /** Keep the children mounted and hide them with `display: "none"` instead of unmounting them. */
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const asList = <T,>(value: T | readonly T[] | undefined): readonly T[] | undefined =>
  value === undefined ? undefined : Array.isArray(value) ? (value as readonly T[]) : [value as T];

/** Pure rule: every given condition must hold (AND). `above="base"` is always true, `below="base"` never. No condition at all is true. */
export function matchesCondition(bp: Breakpoint, sizeClass: SizeClass, condition: ShowCondition): boolean {
  if (condition.above !== undefined && !(rank(bp) >= rank(condition.above))) return false;
  if (condition.below !== undefined && !(rank(bp) < rank(condition.below))) return false;
  const at = asList(condition.at);
  const only = asList(condition.only);
  if (at !== undefined && !at.includes(bp)) return false;
  if (only !== undefined && !only.includes(bp)) return false;
  const classes = asList(condition.sizeClass);
  if (classes !== undefined && !classes.includes(sizeClass)) return false;
  return true;
}

function useMatches(condition: ShowCondition): boolean {
  const { bp } = useBreakpointInfo();
  const { width } = useWindowSizeClass();
  return matchesCondition(bp, width, condition);
}

function Gate({ visible, keepMounted, children }: { visible: boolean; keepMounted?: boolean; children?: React.ReactNode }): React.ReactElement | null {
  // keepMounted always renders the same wrapper View so the subtree keeps its identity (state, effects)
  // across visible <-> hidden; only its style changes. The wrapper does take part in layout.
  if (keepMounted) return <View style={visible ? undefined : { display: "none" }}>{children}</View>;
  return visible ? <>{children}</> : null;
}

/** Renders `children` while the condition holds. */
export function Show({ above, below, at, only, sizeClass, keepMounted, children }: ShowProps): React.ReactElement | null {
  const visible = useMatches({ above, below, at, only, sizeClass });
  return <Gate visible={visible} keepMounted={keepMounted}>{children}</Gate>;
}

/** Renders `children` unless the condition holds (the inverse of `Show`). */
export function Hide({ above, below, at, only, sizeClass, keepMounted, children }: ShowProps): React.ReactElement | null {
  const matches = useMatches({ above, below, at, only, sizeClass });
  return <Gate visible={!matches} keepMounted={keepMounted}>{children}</Gate>;
}
