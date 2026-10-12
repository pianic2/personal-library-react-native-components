// The overlay stack: a small store with no React and no React Native import. One store per root OverlayHost; nested hosts
// (inside a native window such as a Modal) share it, so z-order, Back and Escape are owned in one place (ADR 0015).
import type React from "react";
import { zIndex, type ZIndex } from "../../tokens/zIndex.base.js";

export interface OverlayEntry {
  readonly id: string;
  /** The OverlayHost the entry is rendered by (the nearest host when it was registered). */
  readonly hostId: string;
  readonly content: React.ReactNode;
  /** Whether Back and Escape may close it (through `onDismiss`). */
  readonly dismissable: boolean;
  readonly onDismiss: (() => void) | undefined;
  /** The z-index layer (a `theme.zIndex` key): toasts and tooltips stay above modals whatever the mount order. */
  readonly layer: ZIndex;
  /** Marks the layer as an accessibility modal on iOS. */
  readonly accessibilityViewIsModal: boolean;
  /** Asks scroll containers to stop scrolling while the entry is open (see `useOverlayState`). */
  readonly lockScroll: boolean;
}

export type OverlayInit = Partial<Omit<OverlayEntry, "id" | "hostId" | "content">> & Pick<OverlayEntry, "hostId" | "content">;
export type OverlayPatch = Partial<Omit<OverlayEntry, "id" | "hostId">>;

export interface OverlayStore {
  /** The entries in stacking order, bottom first. A new array after every change, the same array otherwise. */
  getEntries(): readonly OverlayEntry[];
  subscribe(listener: () => void): () => void;
  /** Adds an entry on top of the entries of its layer and returns its id. */
  register(init: OverlayInit): string;
  update(id: string, patch: OverlayPatch): void;
  unregister(id: string): void;
  /**
   * Closes the topmost dismissable entry (the last one in stacking order) by calling its `onDismiss`, and no other.
   * Returns whether an entry was dismissable, which is what a Back handler reports as "handled".
   */
  dismissTop(): boolean;
}

/** The z-index of an entry: its layer plus its position in the stack (a stable tie-break within a layer). */
export function entryZIndex(entry: OverlayEntry, position: number): number {
  return zIndex[entry.layer] + position;
}

export function createOverlayStore(): OverlayStore {
  let entries: readonly OverlayEntry[] = [];
  let counter = 0;
  const listeners = new Set<() => void>();

  const commit = (next: readonly OverlayEntry[]) => {
    // Stacking order: by layer, then by mount order (Array.prototype.sort is stable).
    entries = [...next].sort((a, b) => zIndex[a.layer] - zIndex[b.layer]);
    for (const listener of [...listeners]) listener();
  };

  return {
    getEntries: () => entries,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    register(init) {
      counter += 1;
      const entry: OverlayEntry = {
        id: `overlay-${counter}`,
        hostId: init.hostId,
        content: init.content,
        dismissable: init.dismissable ?? false,
        onDismiss: init.onDismiss,
        layer: init.layer !== undefined && Object.hasOwn(zIndex, init.layer) ? init.layer : "overlay",
        accessibilityViewIsModal: init.accessibilityViewIsModal ?? false,
        lockScroll: init.lockScroll ?? false,
      };
      commit([...entries, entry]);
      return entry.id;
    },
    update(id, patch) {
      const current = entries.find((e) => e.id === id);
      if (!current) return;
      const next = { ...current, ...patch, layer: patch.layer !== undefined && Object.hasOwn(zIndex, patch.layer) ? patch.layer : current.layer };
      const unchanged = (Object.keys(next) as (keyof OverlayEntry)[]).every((key) => next[key] === current[key]);
      if (unchanged) return;
      commit(entries.map((e) => (e.id === id ? next : e)));
    },
    unregister(id) {
      if (!entries.some((e) => e.id === id)) return;
      commit(entries.filter((e) => e.id !== id));
    },
    dismissTop() {
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        const entry = entries[i]!;
        if (entry.dismissable) {
          entry.onDismiss?.();
          return true;
        }
      }
      return false;
    },
  };
}
