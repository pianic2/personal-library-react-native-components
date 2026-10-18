import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { PagerBase } from "./PagerBase.js";
import { useIndexState } from "./useIndexState.js";

export interface PagerProps {
  /** Number of pages. */
  count: number;
  /** Renders the page at `index`. Called only for mounted pages. */
  renderPage: (index: number) => React.ReactNode;
  /** Current page, zero-based. Controlled: the pager follows it and reports swipes through `onIndexChange`. */
  index?: number;
  /** Initial page when `index` is not set. Default 0. */
  defaultIndex?: number;
  /** Called once per swipe, when the pager has settled on a new page. */
  onIndexChange?: (index: number) => void;
  /** Mounts only the current page and its two neighbours. Default true; false mounts every page. */
  lazy?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/** Horizontal paging: one page fills the width, swipes snap to pages, the index is controlled or uncontrolled. */
export function Pager({ count, index, defaultIndex = 0, onIndexChange, lazy = true, ...rest }: PagerProps) {
  const [current, setCurrent] = useIndexState(count, index, defaultIndex, onIndexChange);
  return <PagerBase {...rest} count={count} index={current} onIndexChange={setCurrent} lazy={lazy} peek={0} />;
}
