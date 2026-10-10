// Loads the public API through the legacy specifier (mapped by tests/compat-loader.mjs to the shim, or in the control
// run straight to the built target). Typed as the source API: the shim re-exports it unchanged.
//
// `npm test` also globs this folder but runs without the compat loader: there the sentinel does not resolve to a data: URL and the
// suite falls back to the source API (a plain control run). When the loader IS active it never falls back.
export const LEGACY = process.env.COMPAT_LEGACY ?? "@legacy-placeholder/shim";

// The loader answers the sentinel specifier; without the loader it is unresolvable. Once the sentinel resolves, nothing
// below may fall back: every later error (bad COMPAT_LEGACY, corrupt shim manifest, missing dist) fails the suite.
function loaderActive(): boolean {
  try {
    // Node resolves an unknown URL scheme to itself when no loader is registered; the loader answers with a data: URL.
    return import.meta.resolve("compat-loader:active").startsWith("data:");
  } catch {
    return false;
  }
}

export const compatActive = loaderActive();

type Api = typeof import("../../src/index.js");
type ThemeApi = typeof import("../../src/theme/index.js");
type TokensApi = typeof import("../../src/tokens/index.js");

export const legacy = (compatActive ? await import(LEGACY) : await import("../../src/index.js")) as Api;
export const legacyTheme = (compatActive ? await import(`${LEGACY}/theme`) : await import("../../src/theme/index.js")) as ThemeApi;
export const legacyTokens = (compatActive ? await import(`${LEGACY}/tokens`) : await import("../../src/tokens/index.js")) as TokensApi;
