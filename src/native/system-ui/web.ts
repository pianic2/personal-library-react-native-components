// Web adapter: keeps `<meta name="theme-color">` in sync. The document is injected, so it is testable without a browser.
import { warnSwallowed } from "./warn.js";
import type { SystemBarsConfig, SystemUiAdapter } from "./types.js";

export interface WebMetaElement {
  setAttribute(name: string, value: string): void;
}

/** The slice of `document` the adapter needs. */
export interface WebSystemUiDocument {
  querySelector(selector: string): WebMetaElement | null;
  createElement(tag: "meta"): WebMetaElement;
  head?: { appendChild(node: unknown): unknown } | null;
}

/** Updates the existing `theme-color` meta tag, or creates one in `<head>`. Never rejects. */
export function createWebSystemUi(doc: WebSystemUiDocument): SystemUiAdapter {
  return {
    async apply({ backgroundColor }: SystemBarsConfig) {
      try {
        const existing = doc.querySelector('meta[name="theme-color"]');
        if (existing) {
          existing.setAttribute("content", backgroundColor);
          return;
        }
        if (!doc.head) return;
        const meta = doc.createElement("meta");
        meta.setAttribute("name", "theme-color");
        meta.setAttribute("content", backgroundColor);
        doc.head.appendChild(meta);
      } catch (error) {
        warnSwallowed("theme-color meta", error);
      }
    },
  };
}

/** The web adapter for the current `document`, or `undefined` outside a browser. */
export function resolveWebSystemUi(): SystemUiAdapter | undefined {
  const doc = (globalThis as { document?: WebSystemUiDocument }).document;
  return doc && typeof doc.querySelector === "function" && typeof doc.createElement === "function" ? createWebSystemUi(doc) : undefined;
}
