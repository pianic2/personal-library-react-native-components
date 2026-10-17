// Contract of the app-ready gate (PLRNUI-371). Types only; no runtime, no native import.

/** An async step the app waits for before it shows its content, for example loading fonts or hydrating storage. */
export type AppReadyTask = () => Promise<unknown>;

/** The native splash screen. Both methods must resolve; the gate ignores their failures. */
export interface SplashAdapter {
  /** Keeps the splash visible until `hide` is called. */
  preventAutoHide(): Promise<void>;
  hide(): Promise<void>;
}
