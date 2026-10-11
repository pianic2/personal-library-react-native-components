import type React from "react";
import { useBreakpoint, type Breakpoint } from "../hooks/useBreakpoint.js";
import { resolveResponsive } from "./resolve.js";

export type ResponsiveProps = { [K in Breakpoint]?: React.ReactNode };

/**
 * Renders the node of the current breakpoint with mobile-first fallback: a missing breakpoint uses the nearest smaller
 * one that is given, and nothing is rendered when no node at or below the current breakpoint exists. Only the matching
 * node is mounted. See `Show` for the web hydration caveat.
 */
export function Responsive({ base, sm, md, lg, xl }: ResponsiveProps): React.ReactElement | null {
  const bp = useBreakpoint();
  const node = resolveResponsive<React.ReactNode>({ base, sm, md, lg, xl }, bp);
  return (node ?? null) as React.ReactElement | null;
}
