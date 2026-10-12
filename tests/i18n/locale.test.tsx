import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";

import {
  LocaleProvider,
  defaultLocale,
  defaultMessages,
  formatDate,
  formatMessage,
  formatNumber,
  useDirection,
  useFormat,
  useLocale,
  useMessages,
  useTranslate,
} from "../../src/i18n/index.js";
import type { Direction, MessageKey, Messages } from "../../src/i18n/index.js";

function read<T>(hook: () => T, wrap?: (el: React.ReactElement) => React.ReactElement): T {
  let value!: T;
  function Probe() {
    value = hook();
    return null;
  }
  act(() => {
    TestRenderer.create(wrap ? wrap(<Probe />) : <Probe />);
  });
  return value;
}

async function withoutIntl<T>(run: () => T): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Intl")!;
  Object.defineProperty(globalThis, "Intl", { value: undefined, configurable: true, writable: true });
  try {
    return run();
  } finally {
    Object.defineProperty(globalThis, "Intl", original);
  }
}

describe("PLRNUI-360 i18n messages", () => {
  it("useMessages() returns the typed English default without a provider", () => {
    const messages: Messages = read(() => useMessages());
    assert.equal(messages["password.show"], "Show password");
    assert.equal(messages["validation.required"], "This field is required");
    assert.deepEqual(messages, { ...defaultMessages });
    const key: MessageKey = "toast.undo";
    assert.equal(messages[key], "Undo");
  });

  it("a partial override merges over the defaults and leaves other keys unchanged", () => {
    const messages = read(
      () => useMessages(),
      (el) => <LocaleProvider messages={{ "password.show": "Mostra password" }}>{el}</LocaleProvider>
    );
    assert.equal(messages["password.show"], "Mostra password");
    assert.equal(messages["password.hide"], defaultMessages["password.hide"]);
    assert.equal(Object.keys(messages).length, Object.keys(defaultMessages).length);
  });

  it("nested providers inherit what they do not set and override what they do; non-string overrides are ignored", () => {
    const messages = read(
      () => useMessages(),
      (el) => (
        <LocaleProvider messages={{ "password.show": "A", "password.hide": "B" }}>
          <LocaleProvider messages={{ "password.hide": "C", "toast.undo": 5 as never }}>{el}</LocaleProvider>
        </LocaleProvider>
      )
    );
    assert.deepEqual([messages["password.show"], messages["password.hide"], messages["toast.undo"]], ["A", "C", "Undo"]);
  });

  it("every catalog key is namespaced, non-empty, and placeholders are well formed", () => {
    for (const [key, text] of Object.entries(defaultMessages)) {
      assert.match(key, /^[a-z]+\.[a-zA-Z]+$/, key);
      assert.ok(text.length > 0, key);
      assert.doesNotMatch(text.replace(/\{\w+\}/g, ""), /[{}]/, key);
    }
  });

  it("useTranslate fills placeholders from the active messages; unknown placeholders stay", () => {
    const t = read(
      () => useTranslate(),
      (el) => <LocaleProvider messages={{ "pagination.page": "Pagina {page} di {total}" }}>{el}</LocaleProvider>
    );
    assert.equal(t("pagination.page", { page: 2, total: 9 }), "Pagina 2 di 9");
    assert.equal(t("otp.digit", { index: 1 }), "Digit 1 of {count}");
    assert.equal(t("loading.label"), "Loading");
    assert.equal(formatMessage("no vars {x}"), "no vars {x}");
  });
});

describe("PLRNUI-360 direction and locale", () => {
  it("useDirection() is 'rtl' when I18nManager.isRTL is mocked true, 'ltr' when false", () => {
    const wrap = (isRTL: boolean) => (el: React.ReactElement) => <LocaleProvider i18nManager={{ isRTL }}>{el}</LocaleProvider>;
    assert.equal(read(() => useDirection(), wrap(true)), "rtl");
    assert.equal(read(() => useDirection(), wrap(false)), "ltr");
  });

  it("an explicit direction wins over I18nManager and is inherited by nested providers", () => {
    const direction: Direction = read(
      () => useDirection(),
      (el) => (
        <LocaleProvider direction="rtl" i18nManager={{ isRTL: false }}>
          <LocaleProvider locale="ar">{el}</LocaleProvider>
        </LocaleProvider>
      )
    );
    assert.equal(direction, "rtl");
  });

  it("without a provider the direction is 'ltr' (the test shim has no I18nManager)", () => {
    assert.equal(read(() => useDirection()), "ltr");
  });

  it("useLocale() is the provider locale (inherited), else the runtime default", () => {
    assert.equal(read(() => useLocale(), (el) => <LocaleProvider locale="it-IT"><LocaleProvider>{el}</LocaleProvider></LocaleProvider>), "it-IT");
    assert.equal(read(() => useLocale()), defaultLocale());
    assert.equal(typeof defaultLocale(), "string");
  });
});

describe("PLRNUI-360 formatters", () => {
  it("format numbers and dates with Intl", () => {
    assert.equal(formatNumber(1234.5, "en-US"), "1,234.5");
    assert.equal(formatNumber(0.256, "en-US", { style: "percent" }), "26%");
    assert.equal(formatDate(new Date(Date.UTC(2026, 0, 2)), "en-US", { timeZone: "UTC" }), "1/2/2026");
  });

  it("return a string when global Intl is undefined", async () => {
    await withoutIntl(() => {
      assert.equal(formatNumber(1234.5, "en-US"), "1234.5");
      assert.equal(formatDate(new Date(Date.UTC(2026, 0, 2)), "en-US"), "2026-01-02");
      assert.equal(formatDate(Date.UTC(2026, 0, 2)), "2026-01-02");
      assert.equal(formatDate(new Date(NaN)), "");
      assert.equal(defaultLocale(), "en");
    });
  });

  it("fall back instead of throwing on an invalid locale or options", () => {
    assert.equal(typeof formatNumber(5, "not a locale!!"), "string");
    assert.equal(formatNumber(5, "en-US", { style: "currency" }), "5");
    assert.equal(typeof formatDate(new Date(0), "xx-invalid-locale-zzzzzzzzzz"), "string");
  });

  it("useFormat binds the locale of the provider", () => {
    const f = read(
      () => useFormat(),
      (el) => <LocaleProvider locale="de-DE">{el}</LocaleProvider>
    );
    assert.equal(f.formatNumber(1234.5), "1.234,5");
    assert.equal(f.formatDate(new Date(Date.UTC(2026, 0, 2)), { timeZone: "UTC" }), "2.1.2026");
  });
});

describe("PLRNUI-360 dependencies", () => {
  it("adds no i18n library to package.json", () => {
    assert.doesNotMatch(readFileSync("package.json", "utf8"), /react-intl|i18next/);
  });
});
