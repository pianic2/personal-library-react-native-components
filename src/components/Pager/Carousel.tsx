import React, { useEffect, useState } from "react";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import type { PagerProps } from "./Pager.js";
import { PagerBase } from "./PagerBase.js";
import { useIndexState } from "./useIndexState.js";

export interface CarouselProps extends PagerProps {
  /** Points of the previous and next page shown beside the current one. Default 0 (no peek). */
  peek?: number;
  /** Advances by itself, pausing while the user touches it. Ignored under reduced motion. It stops on the last page (no loop). */
  autoplay?: boolean;
  /** Milliseconds between automatic advances. Default 4000. */
  autoplayInterval?: number;
}

/** A Pager with peeking neighbours, snap-to-page and optional autoplay. No infinite loop. */
export function Carousel({
  count,
  index,
  defaultIndex = 0,
  onIndexChange,
  lazy = true,
  peek = 0,
  autoplay = false,
  autoplayInterval = 4000,
  ...rest
}: CarouselProps) {
  const reduceMotion = useMotionPreference();
  const [current, setCurrent] = useIndexState(count, index, defaultIndex, onIndexChange);
  const [touching, setTouching] = useState(false);
  const run = autoplay && !reduceMotion && !touching && current < count - 1;

  // One timer per page and pause state: a swipe or an advance re-arms it; it is cleared on every change and on unmount.
  useEffect(() => {
    if (!run) return;
    const timer = setTimeout(() => setCurrent(current + 1), autoplayInterval);
    return () => clearTimeout(timer);
  }, [run, current, autoplayInterval, setCurrent]);

  return (
    <PagerBase
      {...rest}
      count={count}
      index={current}
      onIndexChange={setCurrent}
      lazy={lazy}
      peek={Math.max(peek, 0)}
      onInteraction={setTouching}
    />
  );
}
