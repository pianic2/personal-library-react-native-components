// Typed usage compiled by tsconfig.tests.json. The module is declared locally: expo-clipboard is not imported.
import { createExpoClipboardAdapter, useCopyToClipboard } from "../../../src/native/clipboard/index.js";
import type { CopyToClipboard } from "../../../src/native/clipboard/index.js";

declare const Clipboard: {
  setStringAsync(value: string): Promise<boolean>;
  getStringAsync(): Promise<string>;
};

export const adapter = createExpoClipboardAdapter(Clipboard);
export const hook: () => CopyToClipboard = () => useCopyToClipboard({ resetMs: 1000 });
