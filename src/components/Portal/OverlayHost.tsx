import React, { useContext, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import * as ReactNative from "react-native";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { OverlayHostContext, type OverlayHostContextValue } from "./context.js";
import { createOverlayStore, entryZIndex, type OverlayStore } from "./overlayStore.js";

/** The slice of React Native's `BackHandler` the host needs. */
export interface BackHandlerLike {
  addEventListener(event: "hardwareBackPress", handler: () => boolean | null | undefined): { remove(): void };
}

/** The slice of an event target (the web `document`) the Escape key handling needs. */
export interface KeyEventTargetLike {
  addEventListener(type: "keydown", listener: (event: { key?: string; preventDefault?: () => void }) => void): void;
  removeEventListener(type: "keydown", listener: (event: { key?: string; preventDefault?: () => void }) => void): void;
}

export interface OverlayHostProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Root host only: replaces React Native's `BackHandler` (tests, custom shells). */
  backHandler?: BackHandlerLike;
  /** Root host only: replaces the web `document` for the Escape key (tests, iframes). */
  keyTarget?: KeyEventTargetLike;
}

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

function resolveBackHandler(given: BackHandlerLike | undefined): BackHandlerLike | undefined {
  if (given) return given;
  const rn = (ReactNative as unknown as { BackHandler?: BackHandlerLike }).BackHandler;
  return rn && typeof rn.addEventListener === "function" ? rn : undefined;
}

function resolveKeyTarget(given: KeyEventTargetLike | undefined): KeyEventTargetLike | undefined {
  if (given) return given;
  const doc = (globalThis as { document?: Partial<KeyEventTargetLike> }).document;
  return doc && typeof doc.addEventListener === "function" && typeof doc.removeEventListener === "function" ? (doc as KeyEventTargetLike) : undefined;
}

/**
 * Renders the overlays that `Portal` and `useOverlay` register below it, in a View layer above `children` (no native
 * library). The first host in a tree is the root: it owns the stack and listens for Android Back and the web Escape key,
 * closing only the topmost dismissable overlay. A host inside another one (for example inside a native-window surface
 * such as `Modal`, which is a separate window) renders its own overlays but shares the root's stack.
 */
export function OverlayHost({ children, style, backHandler, keyTarget }: OverlayHostProps) {
  const parent = useContext(OverlayHostContext);
  const ownStore = useRef<OverlayStore | null>(null);
  if (!parent && ownStore.current === null) ownStore.current = createOverlayStore();
  const store = parent ? parent.store : (ownStore.current as OverlayStore);
  const hostId = useId();
  const value = useMemo<OverlayHostContextValue>(() => ({ hostId, store }), [hostId, store]);
  const isRoot = !parent;

  useEffect(() => {
    if (!isRoot) return undefined;
    const subscriptions: Array<() => void> = [];
    const back = resolveBackHandler(backHandler);
    if (back) {
      const subscription = back.addEventListener("hardwareBackPress", () => store.dismissTop());
      subscriptions.push(() => subscription.remove());
    }
    const target = resolveKeyTarget(keyTarget);
    if (target) {
      const onKeyDown = (event: { key?: string; preventDefault?: () => void }) => {
        if (event.key === "Escape" && store.dismissTop()) event.preventDefault?.();
      };
      target.addEventListener("keydown", onKeyDown);
      subscriptions.push(() => target.removeEventListener("keydown", onKeyDown));
    }
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [isRoot, store, backHandler, keyTarget]);

  // A host holds no state of its own: its entries belong to the Portals and callers that registered them, and a Portal
  // unregisters when it unmounts, which includes the unmount of a closing native window and its nested host.
  const entries = useSyncExternalStore(store.subscribe, store.getEntries, store.getEntries);
  const mine = entries.filter((entry) => entry.hostId === hostId);

  return (
    <OverlayHostContext.Provider value={value}>
      <View style={[{ flex: 1 }, style]}>
        {children}
        {mine.length > 0 ? (
          <View pointerEvents="box-none" style={FILL}>
            {mine.map((entry) => (
              <View
                key={entry.id}
                pointerEvents="box-none"
                accessibilityViewIsModal={entry.accessibilityViewIsModal || undefined}
                style={[FILL, { zIndex: entryZIndex(entry, entries.indexOf(entry)) }]}
              >
                {entry.content}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </OverlayHostContext.Provider>
  );
}

/** What scroll containers need to know about the stack: the number of open overlays and whether one asked for a scroll lock. */
export interface OverlayState {
  count: number;
  scrollLocked: boolean;
}

const NO_OVERLAYS: OverlayState = { count: 0, scrollLocked: false };

/** The state of the overlay stack of the nearest host (`{ count: 0, scrollLocked: false }` outside any). */
export function useOverlayState(): OverlayState {
  const host = useContext(OverlayHostContext);
  const store = host?.store;
  const entries = useSyncExternalStore(
    store ? store.subscribe : noSubscribe,
    store ? store.getEntries : getNoEntries,
    store ? store.getEntries : getNoEntries,
  );
  return useMemo(() => (entries.length === 0 ? NO_OVERLAYS : { count: entries.length, scrollLocked: entries.some((e) => e.lockScroll) }), [entries]);
}

const noEntries: readonly never[] = [];
const noSubscribe = () => () => undefined;
const getNoEntries = () => noEntries;
