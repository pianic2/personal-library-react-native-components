import { createElement, useCallback, useContext, useMemo } from "react";
import type React from "react";
import { ThemeContext } from "../../theme/ThemeScope.js";
import { useOverlayHost } from "./context.js";
import type { OverlayPatch } from "./overlayStore.js";

export type OverlayOptions = Omit<OverlayPatch, "content">;

export interface OverlayApi {
  /** Opens `content` in the nearest host and returns its id, or `null` when there is no host (a warning in development). */
  open(content: React.ReactNode, options?: OverlayOptions): string | null;
  /** Replaces the content of an open overlay. */
  update(id: string, content: React.ReactNode): void;
  close(id: string): void;
  /** Closes the topmost overlay of the stack, dismissable or not. Returns whether one was closed. */
  closeTop(): boolean;
}

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/**
 * Imperative access to the overlay stack of the nearest `OverlayHost`. The scoped theme of the calling component is
 * forwarded to the content. An overlay stays open until it is closed (also when the caller unmounts) or its host goes.
 */
export function useOverlay(): OverlayApi {
  const host = useOverlayHost();
  const theme = useContext(ThemeContext);
  const wrap = useCallback((content: React.ReactNode) => (theme ? createElement(ThemeContext.Provider, { value: theme }, content) : content), [theme]);

  return useMemo<OverlayApi>(
    () => ({
      open(content, options = {}) {
        if (!host) {
          if (isDev()) console.warn("[useOverlay] no OverlayHost above this component: nothing was opened.");
          return null;
        }
        return host.store.register({ hostId: host.hostId, content: wrap(content), ...options });
      },
      update(id, content) {
        host?.store.update(id, { content: wrap(content) });
      },
      close(id) {
        host?.store.unregister(id);
      },
      closeTop() {
        if (!host) return false;
        const entries = host.store.getEntries();
        const top = entries[entries.length - 1];
        if (!top) return false;
        host.store.unregister(top.id);
        return true;
      },
    }),
    [host, wrap],
  );
}
