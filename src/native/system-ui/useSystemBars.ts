import { useEffect, useMemo } from "react";
import { useTheme } from "../../theme/useTheme.js";
import type { ThemeMode } from "../../theme/types.js";
import { createNoopSystemUi } from "./noop.js";
import { resolveWebSystemUi } from "./web.js";
import { warnSwallowed } from "./warn.js";
import type { SystemUiAdapter } from "./types.js";

const noop = createNoopSystemUi();

export interface UseSystemBarsOptions {
  /** Default: the resolved mode of the theme. */
  mode?: ThemeMode;
  /** Default: `theme.colors.background`. */
  backgroundColor?: string;
  /**
   * The platform adapter: `createExpoSystemUi({ systemUi, navigationBar })` on native. Default: the web adapter in a
   * browser (it sets `meta theme-color`), else a noop, so the hook works with no optional package installed. Hoist or
   * memoize it: a new adapter re-applies.
   */
  adapter?: SystemUiAdapter;
}

/**
 * Applies the system bars and the root background for the current theme in one call: status bar style (use
 * `ThemedStatusBar` for that), Android navigation bar and root view background through the adapter, and the web
 * `theme-color`. Best-effort: a failure of the adapter is swallowed, with a development-only warning, and never throws
 * into the render.
 */
export function useSystemBars(options: UseSystemBarsOptions = {}): void {
  const { theme, mode: themeMode } = useTheme();
  const mode = options.mode ?? themeMode;
  const backgroundColor = options.backgroundColor ?? theme.colors.background;
  const provided = options.adapter;
  // Resolved once per provided adapter: a new web adapter on every render would re-apply on every render.
  const adapter = useMemo(() => provided ?? resolveWebSystemUi() ?? noop, [provided]);

  useEffect(() => {
    try {
      Promise.resolve(adapter.apply({ mode, backgroundColor })).catch((error: unknown) => warnSwallowed("apply", error));
    } catch (error) {
      warnSwallowed("apply", error);
    }
  }, [adapter, mode, backgroundColor]);
}
