// Structural adapter for an injected React Native `Share` (the module itself is never imported here).
import type { ShareAdapter, ShareContent, ShareResult } from "./types.js";

/** The slice of `Share` from `react-native` the adapter needs. `sharedAction` / `dismissedAction` are its static constants. */
export interface ReactNativeShareLike {
  share(
    content: { message?: string; url?: string; title?: string },
    options?: { dialogTitle?: string }
  ): Promise<{ action: string; activityType?: string | null }>;
  readonly sharedAction?: string;
  readonly dismissedAction?: string;
}

/** Fallbacks for the `action` constants when the injected object does not expose them. These are React Native's values. */
const SHARED = "sharedAction";
const DISMISSED = "dismissedAction";

const hasText = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/**
 * Maps `Share.share` to a `ShareResult`: `dismissedAction` is `dismissed`, `sharedAction` is `shared`, content with neither
 * a message nor a url is `unsupported` without calling the sheet, and a rejection or an unknown action is `unsupported`.
 * Usage: `createReactNativeShare(Share)` with `import { Share } from "react-native"` in the app.
 */
export function createReactNativeShare(Share: ReactNativeShareLike): ShareAdapter {
  return {
    async share(content: ShareContent): Promise<ShareResult> {
      if (!hasText(content?.message) && !hasText(content?.url)) return { action: "unsupported" };
      try {
        const payload: { message?: string; url?: string; title?: string } = {};
        if (hasText(content.message)) payload.message = content.message;
        if (hasText(content.url)) payload.url = content.url;
        if (hasText(content.title)) payload.title = content.title;
        const answer = await Share.share(payload, hasText(content.title) ? { dialogTitle: content.title } : undefined);
        const action = answer?.action;
        if (action === (Share.dismissedAction ?? DISMISSED)) return { action: "dismissed" };
        if (action === (Share.sharedAction ?? SHARED)) return { action: "shared" };
        return { action: "unsupported" };
      } catch {
        return { action: "unsupported" };
      }
    },
  };
}
