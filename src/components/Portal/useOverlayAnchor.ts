import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

/** A rectangle in window coordinates (density-independent pixels). */
export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What an anchor needs to offer: React Native host components implement `measureInWindow`. */
export interface AnchorHandle {
  measureInWindow?(callback: (x: number, y: number, width: number, height: number) => void): void;
}

export interface OverlayAnchor {
  /** The last measured rectangle, or `null` before the first measurement. */
  rect: AnchorRect | null;
  /** Measures the anchor now. Resolves to `null` when the ref is empty or cannot be measured (web without layout, test hosts). */
  measure(): Promise<AnchorRect | null>;
}

/** Measures the element behind `ref` in window coordinates, for overlays that sit next to it (Popover, Tooltip, Select). */
export function useOverlayAnchor(ref: React.RefObject<AnchorHandle | null>): OverlayAnchor {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const measure = useCallback(
    () =>
      new Promise<AnchorRect | null>((resolve) => {
        const node = ref.current;
        if (!node || typeof node.measureInWindow !== "function") {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          const next: AnchorRect = { x, y, width, height };
          if (mounted.current) setRect((current) => (current && current.x === x && current.y === y && current.width === width && current.height === height ? current : next));
          resolve(next);
        });
      }),
    [ref],
  );

  return { rect, measure };
}
