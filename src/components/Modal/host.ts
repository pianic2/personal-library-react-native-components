// src/components/Modal/host.ts
//
// The screen-reader side of Modal (announce on open, move or restore the accessibility focus), looked up defensively from
// `react-native` so SSR and the test shim never throw. `setModalAccessibilityHost` lets a test (or an app on a custom host)
// replace it; it is not exported from the component index.
import * as ReactNative from "react-native";

export interface ModalAccessibilityHost {
  /** Announces `message` to the screen reader. */
  announce(message: string): void;
  /** Moves the screen-reader focus to `node` (a ref value). A node that cannot take focus is ignored. */
  focus(node: unknown): void;
}

interface RNLike {
  AccessibilityInfo?: {
    announceForAccessibility?: (message: string) => void;
    setAccessibilityFocus?: (reactTag: number) => void;
  };
  findNodeHandle?: (node: unknown) => number | null;
}

function nativeHost(): ModalAccessibilityHost {
  const rn = ReactNative as unknown as RNLike;
  return {
    announce(message) {
      rn.AccessibilityInfo?.announceForAccessibility?.(message);
    },
    focus(node) {
      if (node === null || node === undefined) return;
      const tag = rn.findNodeHandle?.(node);
      if (typeof tag === "number") rn.AccessibilityInfo?.setAccessibilityFocus?.(tag);
    },
  };
}

let override: ModalAccessibilityHost | null = null;

export function getModalAccessibilityHost(): ModalAccessibilityHost {
  return override ?? nativeHost();
}

/** Replaces the host (pass `null` to restore the default) and returns a function that puts the previous one back. */
export function setModalAccessibilityHost(host: ModalAccessibilityHost | null): () => void {
  const previous = override;
  override = host;
  return () => {
    override = previous;
  };
}
