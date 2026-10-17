// Contract of the system UI sync (PLRNUI-288). Types only; no runtime, no native import.
import type { ThemeMode } from "../../theme/types.js";

/** What the system bars and the root background should show. */
export interface SystemBarsConfig {
  /** `dark` needs light bar content (status bar icons and Android navigation buttons), `light` needs dark content. */
  mode: ThemeMode;
  /** The colour behind the app: the root view background, the web `theme-color`, the Android navigation bar. */
  backgroundColor: string;
}

/**
 * Applies a `SystemBarsConfig` to the platform. Best-effort by contract: `apply` may reject or throw, and callers
 * (`useSystemBars`) swallow that, so an adapter does not have to guard each step itself.
 */
export interface SystemUiAdapter {
  apply(config: SystemBarsConfig): Promise<void>;
}
