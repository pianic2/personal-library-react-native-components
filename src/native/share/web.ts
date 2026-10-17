import type { ShareAdapter, ShareContent, ShareResult } from "./types.js";

/** The slice of `navigator` the web adapter needs. `share` is missing on desktop browsers and on non-secure origins. */
export interface WebNavigatorLike {
  share?: (data: { text?: string; url?: string; title?: string }) => Promise<void>;
}

export interface WebShareOptions {
  /**
   * Called with the url (or the message when there is no url) when `navigator.share` is missing, so the app can copy the link
   * and show its own confirmation. The result is still `unsupported`: nothing was shared through a sheet. Errors from the hook
   * are swallowed.
   */
  onUnsupported?: (content: ShareContent) => void | Promise<void>;
}

const hasText = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** `AbortError` is how `navigator.share` reports that the user closed the sheet. */
const isAbort = (error: unknown): boolean => typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";

/**
 * Maps `navigator.share` to a `ShareResult`: a resolved promise is `shared`, an `AbortError` is `dismissed`, any other
 * rejection, a missing `navigator.share` and empty content are `unsupported`. It never throws.
 * Pass `globalThis.navigator` (it may be undefined outside a browser).
 */
export function createWebShare(navigatorLike: WebNavigatorLike | undefined, options: WebShareOptions = {}): ShareAdapter {
  return {
    async share(content: ShareContent): Promise<ShareResult> {
      const text = hasText(content?.message) ? content.message : undefined;
      const url = hasText(content?.url) ? content.url : undefined;
      if (text === undefined && url === undefined) return { action: "unsupported" };
      if (typeof navigatorLike?.share !== "function") {
        if (options.onUnsupported) {
          try {
            await options.onUnsupported(content);
          } catch {
            // the fallback is best effort
          }
        }
        return { action: "unsupported" };
      }
      try {
        const data: { text?: string; url?: string; title?: string } = {};
        if (text !== undefined) data.text = text;
        if (url !== undefined) data.url = url;
        if (hasText(content.title)) data.title = content.title;
        await navigatorLike.share(data);
        return { action: "shared" };
      } catch (error) {
        return { action: isAbort(error) ? "dismissed" : "unsupported" };
      }
    },
  };
}
