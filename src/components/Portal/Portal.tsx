import React, { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { Modal as RNModal } from "react-native";
import { ThemeContext } from "../../theme/ThemeScope.js";
import type { ZIndex } from "../../tokens/zIndex.base.js";
import { useOverlayHost } from "./context.js";

export interface PortalProps {
  /** Rendered by the nearest OverlayHost, above its content. */
  children?: React.ReactNode;
  /** Whether Back (Android) and Escape (web) may close it by calling `onDismiss`. Default `false`. */
  dismissable?: boolean;
  /** Called when Back or Escape closes this portal; the owner is responsible for unmounting it. */
  onDismiss?: () => void;
  /** The `theme.zIndex` layer. Default `"overlay"`. Toasts and tooltips stay above modals whatever the mount order. */
  layer?: ZIndex;
  /** Marks the portal's layer as an accessibility modal on iOS: VoiceOver ignores the views behind it. */
  accessibilityViewIsModal?: boolean;
  /** Asks scroll containers to stop scrolling while this portal is open (read with `useOverlayState`). */
  lockScroll?: boolean;
}

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/**
 * Mounts `children` into the nearest `OverlayHost` instead of where the Portal is written. Several portals stack in mount
 * order; unmounting removes the content. The scoped theme of the Portal's position is forwarded explicitly (React Native
 * has no `createPortal`, so the content is rendered by the host, outside the Portal's context): wrap other contexts you
 * need yourself.
 *
 * Without a host there is a documented fallback: the children are shown in React Native's `Modal` and, in development,
 * a warning says so.
 */
export function Portal({ children, dismissable = false, onDismiss, layer, accessibilityViewIsModal, lockScroll }: PortalProps) {
  const host = useOverlayHost();
  const theme = useContext(ThemeContext);
  const idRef = useRef<string | null>(null);

  // The latest callback is read when Back is pressed, so a new `onDismiss` identity does not re-register the portal.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const content = theme ? <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider> : children;

  // Register once per host, remove on unmount.
  useLayoutEffect(() => {
    if (!host) return undefined;
    const id = host.store.register({
      hostId: host.hostId,
      content,
      dismissable,
      onDismiss: () => onDismissRef.current?.(),
      ...(layer !== undefined ? { layer } : {}),
      ...(accessibilityViewIsModal !== undefined ? { accessibilityViewIsModal } : {}),
      ...(lockScroll !== undefined ? { lockScroll } : {}),
    });
    idRef.current = id;
    return () => {
      idRef.current = null;
      host.store.unregister(id);
    };
    // `content` and the options are applied by the update effect below; the registration itself depends on the host only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  // Keep the registered entry in step with the props.
  useLayoutEffect(() => {
    if (!host || idRef.current === null) return;
    host.store.update(idRef.current, {
      content,
      dismissable,
      ...(layer !== undefined ? { layer } : {}),
      ...(accessibilityViewIsModal !== undefined ? { accessibilityViewIsModal } : {}),
      ...(lockScroll !== undefined ? { lockScroll } : {}),
    });
  });

  useEffect(() => {
    if (!host && isDev()) {
      console.warn("[Portal] no OverlayHost above this Portal: falling back to a React Native Modal. Render an OverlayHost near the root of the app.");
    }
  }, [host]);

  if (host) return null;
  return (
    <RNModal transparent visible onRequestClose={dismissable ? onDismiss : undefined}>
      {content}
    </RNModal>
  );
}
