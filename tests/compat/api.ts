// Loads the public API through the legacy specifier (mapped by tests/compat-loader.mjs to the shim, or in the control
// run straight to the built target). Typed as the source API: the shim re-exports it unchanged.
//
// `npm test` also globs this folder but runs without the compat loader: there the specifier cannot be resolved and the
// suite falls back to the source API (a plain control run). When the loader IS active it never falls back: a loader
// error (for example a missing dist-shim) is rethrown and fails the suite.
export const LEGACY = process.env.COMPAT_LEGACY ?? "@legacy-placeholder/shim";

function loaderActive(): boolean {
  try {
    import.meta.resolve(LEGACY);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("compat loader")) throw error;
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
