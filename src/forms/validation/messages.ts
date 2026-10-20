import { defaultMessages, formatMessage } from "../../i18n/index.js";
import type { MessageKey, MessageOverrides, MessageVars, Messages } from "../../i18n/index.js";

let overrides: MessageOverrides = {};

/**
 * Overrides catalog messages for every resolver (non-React use, or one call at app start). Merges into earlier calls;
 * `setValidationMessages({})` changes nothing and `resetValidationMessages()` clears them. Prefer `LocaleProvider`
 * `messages` with `useResolver` when the translations follow the rendered tree.
 */
export function setValidationMessages(partial: MessageOverrides): void {
  const next: MessageOverrides = { ...overrides };
  for (const [key, text] of Object.entries(partial)) if (typeof text === "string") next[key as MessageKey] = text;
  overrides = next;
}

/** Removes every override set with `setValidationMessages`. */
export function resetValidationMessages(): void {
  overrides = {};
}

/** Builds the lookup used by rules: global overrides, then `catalog` (e.g. `useMessages()`), then the English defaults. */
export function createMessageLookup(catalog?: Partial<Messages>): (key: MessageKey, vars?: MessageVars) => string {
  return (key, vars) => formatMessage(overrides[key] ?? catalog?.[key] ?? defaultMessages[key], vars);
}
