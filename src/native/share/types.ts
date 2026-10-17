// Contract of the share adapter (PLRNUI-301). Types only; no runtime, no native import.

/** What to share. React Native needs at least a `message` or a `url`. */
export interface ShareContent {
  message?: string;
  url?: string;
  /** Sheet title (Android dialog title, web share title). Ignored where the platform has none. */
  title?: string;
}

/**
 * `shared`: the user completed the share sheet. `dismissed`: the user closed it. `unsupported`: there is no share sheet
 * here (web without `navigator.share`, no adapter configured), the content is empty, or the platform call failed.
 */
export type ShareResult = { action: "shared" | "dismissed" | "unsupported" };

/** A share sheet. `share` never rejects: every failure is an `unsupported` result. */
export interface ShareAdapter {
  share(content: ShareContent): Promise<ShareResult>;
}
