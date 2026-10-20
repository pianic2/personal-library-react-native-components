// The drag gesture of the BottomSheet behind a small interface, so the default (PanResponder) can be replaced by an
// adapter over react-native-gesture-handler without a native dependency in the core.

export interface DragCallbacks {
  /** The finger went down on the handle. */
  onStart(): void;
  /** Vertical distance since the start, positive downwards. */
  onMove(dy: number): void;
  /** The finger was released (or the gesture was taken over) with the final distance and velocity (px/ms, positive downwards). */
  onEnd(dy: number, vy: number): void;
}

/** Props spread on the drag handle. */
export type DragHandlers = Record<string, unknown>;

/** Replaces the built-in PanResponder gesture. Return the props to spread on the drag handle view. */
export interface GestureDriver {
  createHandlers(callbacks: DragCallbacks): DragHandlers;
}

interface GestureStateLike {
  dy: number;
  vy: number;
}

export interface PanResponderLike {
  create(config: Record<string, unknown>): { panHandlers: DragHandlers };
}

/** The default driver, over React Native's `PanResponder` (or a stand-in with the same `create`). */
export function createPanResponderDriver(panResponder: PanResponderLike): GestureDriver {
  return {
    createHandlers(callbacks) {
      return panResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e: unknown, g: GestureStateLike) => Math.abs(g.dy) > 2,
        // The sheet owns the vertical drag once it started: scroll views inside it must not steal it.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => callbacks.onStart(),
        onPanResponderMove: (_e: unknown, g: GestureStateLike) => callbacks.onMove(g.dy),
        onPanResponderRelease: (_e: unknown, g: GestureStateLike) => callbacks.onEnd(g.dy, g.vy),
        onPanResponderTerminate: (_e: unknown, g: GestureStateLike) => callbacks.onEnd(g.dy, g.vy),
      }).panHandlers;
    },
  };
}
