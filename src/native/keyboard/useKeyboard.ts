import { useCallback, useEffect, useMemo, useState } from "react";
import { dismissKeyboard, resolveKeyboardHost, resolvePlatformOS } from "./host.js";
import type { KeyboardApi, KeyboardEventPayload, KeyboardState, UseKeyboardOptions } from "./types.js";

const HIDDEN: KeyboardState = { visible: false, height: 0, duration: 0 };

const number = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0);

/**
 * Keyboard visibility, height and animation duration; `dismiss()` closes it. Subscribes to `keyboardWillShow/Hide`
 * on iOS and `keyboardDidShow/Hide` elsewhere, and removes every listener on unmount. Without a keyboard host (web,
 * SSR) it reports `visible: false` and `dismiss` is a no-op.
 */
export function useKeyboard(options: UseKeyboardOptions = {}): KeyboardApi {
  const { host: injected, platform } = options;
  const host = useMemo(() => injected ?? resolveKeyboardHost(), [injected]);
  const os = platform ?? resolvePlatformOS();
  const [state, setState] = useState<KeyboardState>(HIDDEN);

  useEffect(() => {
    if (!host) {
      setState(HIDDEN);
      return undefined;
    }
    const ios = os === "ios";
    const onShow = (event: KeyboardEventPayload) =>
      setState({ visible: true, height: number(event?.endCoordinates?.height), duration: number(event?.duration) });
    const onHide = (event: KeyboardEventPayload) =>
      setState({ visible: false, height: 0, duration: number(event?.duration) });
    const subscriptions = [
      host.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", onShow),
      host.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", onHide),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [host, os]);

  const dismiss = useCallback(() => dismissKeyboard(host), [host]);
  return useMemo(() => ({ ...state, dismiss }), [state, dismiss]);
}

/** True while the keyboard is shown. */
export function useKeyboardVisible(options?: UseKeyboardOptions): boolean {
  return useKeyboard(options).visible;
}
