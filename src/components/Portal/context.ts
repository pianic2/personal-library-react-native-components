import { createContext, useContext } from "react";
import type { OverlayStore } from "./overlayStore.js";

export interface OverlayHostContextValue {
  /** Identifies the host that provides this value. */
  readonly hostId: string;
  readonly store: OverlayStore;
}

/** The nearest OverlayHost, or `null` outside any. */
export const OverlayHostContext = createContext<OverlayHostContextValue | null>(null);

export function useOverlayHost(): OverlayHostContextValue | null {
  return useContext(OverlayHostContext);
}
