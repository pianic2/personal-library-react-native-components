import React, { createContext, useCallback, useContext, useMemo } from "react";
import * as ReactNative from "react-native";
import { defaultLocale, formatDate, formatNumber } from "./format.js";
import { defaultMessages, formatMessage, type MessageKey, type MessageOverrides, type MessageVars, type Messages } from "./messages.js";

export type Direction = "ltr" | "rtl";

interface LocaleState {
  locale: string | undefined;
  direction: Direction | undefined;
  messages: Messages;
}

const DEFAULT_MESSAGES: Messages = defaultMessages;
const Context = createContext<LocaleState>({ locale: undefined, direction: undefined, messages: DEFAULT_MESSAGES });

/** The slice of React Native's `I18nManager` that is read. */
export interface I18nManagerLike {
  isRTL?: boolean;
}

export interface LocaleProviderProps {
  /** BCP 47 tag used by the formatters (`"it-IT"`). Default: the runtime's default locale. */
  locale?: string;
  /** Text direction. Default: the `i18nManager` prop, else the outer provider's direction, else React Native's `I18nManager.isRTL`. */
  direction?: Direction;
  /**
   * Replaces the `I18nManager` read (tests, previews, web). Only `isRTL` is read, once per render of the provider; an
   * `isRTL` of `undefined` is ignored. The nearest provider that sets a direction (through `direction` or this prop) wins.
   */
  i18nManager?: I18nManagerLike;
  /** Translations; unspecified keys keep the value of the outer provider or the English default. Hoist or memoize it. */
  messages?: MessageOverrides;
  children?: React.ReactNode;
}

function directionOf(isRTL: boolean | undefined): Direction | undefined {
  return isRTL === undefined ? undefined : isRTL ? "rtl" : "ltr";
}

function readDirection(): Direction | undefined {
  return directionOf((ReactNative as unknown as { I18nManager?: I18nManagerLike }).I18nManager?.isRTL);
}

/**
 * Locale, direction and message overrides for the subtree. Nested providers inherit what they do not set. Without a
 * provider everything is available with English defaults, the runtime locale and the `I18nManager` direction.
 */
export function LocaleProvider({ locale, direction, i18nManager, messages, children }: LocaleProviderProps) {
  const parent = useContext(Context);
  const managerIsRTL = i18nManager?.isRTL; // a primitive dependency: an inline `{ isRTL: true }` must not rebuild the context
  const value = useMemo<LocaleState>(() => {
    const merged: Messages = { ...parent.messages };
    for (const [key, text] of Object.entries(messages ?? {})) if (typeof text === "string") merged[key as MessageKey] = text;
    return {
      locale: locale ?? parent.locale,
      direction: direction ?? directionOf(managerIsRTL) ?? parent.direction,
      messages: merged,
    };
  }, [parent, locale, direction, managerIsRTL, messages]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** All messages (English defaults merged with the provider overrides). */
export function useMessages(): Messages {
  return useContext(Context).messages;
}

/** `t("pagination.page", { page: 2, total: 9 })`. */
export function useTranslate(): (key: MessageKey, vars?: MessageVars) => string {
  const { messages } = useContext(Context);
  return useCallback((key, vars) => formatMessage(messages[key] ?? DEFAULT_MESSAGES[key] ?? key, vars), [messages]);
}

/** The BCP 47 locale in use. */
export function useLocale(): string {
  return useContext(Context).locale ?? defaultLocale();
}

/** `"rtl"` or `"ltr"`: the provider's direction, else `I18nManager.isRTL`, else `"ltr"`. */
export function useDirection(): Direction {
  return useContext(Context).direction ?? readDirection() ?? "ltr";
}

/** Number and date formatters bound to the locale in use (with the Intl fallback). */
export function useFormat() {
  const locale = useLocale();
  return useMemo(
    () => ({
      formatNumber: (value: number, options?: Record<string, unknown>) => formatNumber(value, locale, options),
      formatDate: (value: Date | number, options?: Record<string, unknown>) => formatDate(value, locale, options),
    }),
    [locale]
  );
}
