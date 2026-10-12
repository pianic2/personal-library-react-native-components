/** Keyboard state: `height` and `duration` are in points and milliseconds, 0 while hidden / unknown. */
export interface KeyboardState {
  visible: boolean;
  height: number;
  duration: number;
}

export interface KeyboardApi extends KeyboardState {
  /** Dismisses the keyboard (`Keyboard.dismiss`); a no-op on web or when react-native has no `Keyboard`. */
  dismiss(): void;
}

/** The slice of an event emitter subscription the hooks rely on. */
export interface KeyboardSubscription {
  remove(): void;
}

/** Payload of the keyboard events; only the fields the hooks read. */
export interface KeyboardEventPayload {
  duration?: number;
  endCoordinates?: { height?: number };
}

/** The slice of react-native's `Keyboard` the hooks use. Inject a mock in tests. */
export interface KeyboardHost {
  addListener(
    event: "keyboardWillShow" | "keyboardWillHide" | "keyboardDidShow" | "keyboardDidHide",
    listener: (event: KeyboardEventPayload) => void
  ): KeyboardSubscription;
  dismiss(): void;
}

export interface UseKeyboardOptions {
  /** Overrides react-native's `Keyboard` (tests, custom hosts). */
  host?: KeyboardHost;
  /** Overrides `Platform.OS` when choosing between the will* (iOS) and did* (Android) events. */
  platform?: string;
}
