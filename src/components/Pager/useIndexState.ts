import { useCallback, useState } from "react";
import { clampIndex } from "./PagerBase.js";

/** Controlled (`index`) or uncontrolled (`defaultIndex`) page index. `set` reports through `onIndexChange` once per change. */
export function useIndexState(count: number, index: number | undefined, defaultIndex: number, onIndexChange?: (index: number) => void) {
  const [inner, setInner] = useState(() => clampIndex(defaultIndex, count));
  const controlled = index !== undefined;
  const current = clampIndex(controlled ? index : inner, count);
  const set = useCallback(
    (next: number) => {
      const page = clampIndex(next, count);
      if (page === current) return;
      if (!controlled) setInner(page);
      onIndexChange?.(page);
    },
    [count, current, controlled, onIndexChange]
  );
  return [current, set] as const;
}
