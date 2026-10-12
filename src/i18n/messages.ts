/**
 * Built-in strings, English defaults. Keys are namespaced by component (`<component>.<name>`) and are semver surface:
 * a key is never renamed or removed in a minor release. A message may contain `{name}` placeholders.
 */
export const defaultMessages = {
  "validation.required": "This field is required",
  "validation.minLength": "Enter at least {min} characters",
  "validation.maxLength": "Enter at most {max} characters",
  "validation.pattern": "The value is not in the expected format",
  "validation.email": "Enter a valid email address",
  "validation.number": "Enter a valid number",
  "password.show": "Show password",
  "password.hide": "Hide password",
  "otp.label": "Verification code",
  "otp.digit": "Digit {index} of {count}",
  "combobox.empty": "No results",
  "combobox.loading": "Loading results",
  "toast.undo": "Undo",
  "toast.dismiss": "Dismiss notification",
  "pagination.previous": "Previous page",
  "pagination.next": "Next page",
  "pagination.page": "Page {page} of {total}",
  "loading.label": "Loading",
  "dialog.close": "Close dialog",
} as const;

export type MessageKey = keyof typeof defaultMessages;

/** Every message as a plain string (the typed catalog widened so translations can differ). */
export type Messages = { [K in MessageKey]: string };

/** A subset of the catalog: unspecified keys keep their default. */
export type MessageOverrides = Partial<Messages>;

export type MessageVars = Record<string, string | number>;

/** Replaces `{name}` placeholders; an unknown placeholder is left as written. */
export function formatMessage(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
