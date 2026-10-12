// Web adapter: `navigator.clipboard` with an `execCommand("copy")` fallback for writing. No native package.
import type { ClipboardApi } from "../core/types.js";

export interface WebClipboardNavigator {
  clipboard?: { writeText?(value: string): Promise<void>; readText?(): Promise<string> };
}

/** The slice of `document` the `execCommand` fallback needs. */
export interface WebClipboardDocument {
  body?: { appendChild(node: unknown): unknown; removeChild(node: unknown): unknown } | null;
  createElement(tag: "textarea"): {
    value: string;
    style?: Record<string, string>;
    setAttribute?(name: string, value: string): void;
    select(): void;
  };
  execCommand?(command: "copy"): boolean;
}

export interface WebClipboardEnv {
  navigator?: WebClipboardNavigator;
  document?: WebClipboardDocument;
}

function execCopy(doc: WebClipboardDocument, value: string): boolean {
  if (typeof doc.execCommand !== "function" || !doc.body) return false;
  const field = doc.createElement("textarea");
  field.value = value;
  field.setAttribute?.("readonly", "");
  if (field.style) Object.assign(field.style, { position: "fixed", opacity: "0", pointerEvents: "none" });
  doc.body.appendChild(field);
  try {
    field.select();
    return doc.execCommand("copy") === true;
  } finally {
    try {
      doc.body.removeChild(field);
    } catch {
      // the field is already gone; the copy result must not be masked
    }
  }
}

/** Whether the environment can write text at all. */
export function canWriteWebClipboard(env: WebClipboardEnv): boolean {
  return typeof env.navigator?.clipboard?.writeText === "function" || typeof env.document?.execCommand === "function";
}

/**
 * Writes with `navigator.clipboard.writeText` and falls back to `execCommand("copy")` when it is missing or rejects
 * (for example in an insecure context). Reading needs `navigator.clipboard.readText` and otherwise resolves "".
 * A failed write rejects.
 */
export function createWebClipboard(env: WebClipboardEnv): ClipboardApi {
  return {
    async setString(value) {
      let first: unknown;
      const writeText = env.navigator?.clipboard?.writeText;
      if (typeof writeText === "function") {
        try {
          await writeText.call(env.navigator!.clipboard, value);
          return;
        } catch (failure) {
          first = failure; // keep the original error (for example NotAllowedError) if the fallback fails too
        }
      }
      if (env.document && execCopy(env.document, value)) return;
      throw first ?? new Error("Clipboard write is not available");
    },
    async getString() {
      const readText = env.navigator?.clipboard?.readText;
      return typeof readText === "function" ? String(await readText.call(env.navigator!.clipboard)) : "";
    },
  };
}

/** The web api for the current globals, or `undefined` when nothing can write. */
export function resolveWebClipboard(): ClipboardApi | undefined {
  const g = globalThis as { navigator?: WebClipboardNavigator; document?: WebClipboardDocument };
  const env: WebClipboardEnv = { navigator: g.navigator, document: g.document };
  return canWriteWebClipboard(env) ? createWebClipboard(env) : undefined;
}
