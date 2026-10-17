// Contract of the share adapter (PLRNUI-301). Types only; no runtime, no native import.

/**
 * What to share. At least a `message` or a `url` is required. On Android React Native ignores `url`, so put the link in
 * `message` there (a url-only share has no payload on Android).
 */
export interface ShareContent {
  message?: string;
  url?: string;
  /** Sheet title (Android dialog title, web share title). Ignored where the platform has none. */
  title?: string;
}

/**
 * `shared`: the user completed the share sheet. `dismissed`: the user closed it. `unsupported`: there is no share sheet
 * here (web without `navigator.share`, no adapter configured), the content is empty, the platform call failed, or another
 * share is still pending in `useShare`.
 */
export type ShareResult = { action: "shared" | "dismissed" | "unsupported" };

/** A share sheet. `share` never rejects: every failure is an `unsupported` result. */
export interface ShareAdapter {
  share(content: ShareContent): Promise<ShareResult>;
}
