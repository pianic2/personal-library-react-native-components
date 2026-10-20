// src/motion/Stagger.tsx
//
// Reveals its children one after another: child `i` is shown (through `Presence`) after the delay `useStagger` gives index `i`.
import React, { useEffect, useState } from "react";
import { Presence, type PresenceProps } from "./Presence.js";
import { useStagger, type StaggerOptions } from "./useStagger.js";

export interface StaggerProps extends StaggerOptions {
  /** Enter preset of every child. Default `"fade"`. */
  preset?: PresenceProps["preset"];
  children?: React.ReactNode;
}

export function Stagger({ preset = "fade", delay, max, tokens, children }: StaggerProps): React.ReactElement {
  const items = React.Children.toArray(children);
  const delays = useStagger(items.length, { delay, max, tokens });
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    let immediate = 0;
    delays.forEach((ms, i) => {
      if (ms <= 0) immediate = i + 1;
      else timers.push(setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), ms));
    });
    setRevealed((r) => Math.max(r, immediate));
    return () => timers.forEach(clearTimeout);
  }, [delays]);

  return (
    <>
      {items.map((child, i) => (
        <Presence key={(child as React.ReactElement).key ?? i} visible={i < revealed} preset={preset} appear tokens={tokens}>
          {child}
        </Presence>
      ))}
    </>
  );
}
