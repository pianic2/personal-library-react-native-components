import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { LocaleProvider, defaultMessages } from "../../src/i18n/index.js";
import {
  createResolver,
  custom,
  email,
  matches,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  resetValidationMessages,
  setValidationMessages,
  useResolver,
} from "../../src/forms/validation/index.js";
import type { Errors, Resolver, RuleMap } from "../../src/forms/validation/index.js";

interface Form {
  name: string;
  email: string;
  password: string;
  confirm: string;
  age: number | string;
  address: { city: string };
}

const valid: Form = { name: "Ada", email: "ada@example.com", password: "secret12", confirm: "secret12", age: 30, address: { city: "Rome" } };

afterEach(() => resetValidationMessages());

function run<T>(rules: RuleMap<T>, values: T): Errors<T> {
  const out = createResolver<T>(rules)(values);
  assert.ok(!(out instanceof Promise), "expected a synchronous result");
  return out;
}

describe("built-in rules", () => {
  it("required", () => {
    const rules: RuleMap<Form> = { name: required() };
    assert.deepEqual(run(rules, valid), {});
    for (const empty of ["", "   "]) assert.equal(run(rules, { ...valid, name: empty }).name, defaultMessages["validation.required"]);
    assert.equal(run({ age: required() } as RuleMap<Form>, { ...valid, age: 0 }).age, undefined);
    assert.equal(run({ name: required("Mandatory") }, { ...valid, name: "" }).name, "Mandatory");
  });

  it("minLength and maxLength", () => {
    assert.equal(run({ name: minLength(3) }, valid).name, undefined);
    assert.equal(run({ name: minLength(4) }, valid).name, "Enter at least 4 characters");
    assert.equal(run({ name: minLength(4) }, { ...valid, name: "" }).name, undefined, "empty is the job of required");
    assert.equal(run({ name: maxLength(3) }, valid).name, undefined);
    assert.equal(run({ name: maxLength(2) }, valid).name, "Enter at most 2 characters");
    assert.equal(run({ name: maxLength(2, "Too long") }, valid).name, "Too long");
  });

  it("pattern, including a global regexp", () => {
    assert.equal(run({ name: pattern(/^[A-Z]/) }, valid).name, undefined);
    assert.equal(run({ name: pattern(/^[a-z]/) }, valid).name, defaultMessages["validation.pattern"]);
    const global = pattern(/a/g);
    const resolver = createResolver<Form>({ name: global });
    assert.deepEqual([resolver(valid), resolver(valid)], [{}, {}]);
  });

  it("email", () => {
    assert.equal(run({ email: email() }, valid).email, undefined);
    for (const bad of ["ada", "ada@", "ada@example", "a b@c.d"]) assert.equal(run({ email: email() }, { ...valid, email: bad }).email, defaultMessages["validation.email"]);
    assert.equal(run({ email: email() }, { ...valid, email: "" }).email, undefined);
  });

  it("min and max", () => {
    assert.equal(run({ age: min(18) }, valid).age, undefined);
    assert.equal(run({ age: min(40) }, valid).age, defaultMessages["validation.number"]);
    assert.equal(run({ age: min(40, "Too young") }, valid).age, "Too young");
    assert.equal(run({ age: min(1) }, { ...valid, age: "abc" }).age, defaultMessages["validation.number"]);
    assert.equal(run({ age: max(40) }, { ...valid, age: "30" }).age, undefined);
    assert.equal(run({ age: max(20, "Too old") }, valid).age, "Too old");
  });

  it("matches compares with another field", () => {
    assert.equal(run({ confirm: matches("password") }, valid).confirm, undefined);
    assert.equal(run({ confirm: matches("password") }, { ...valid, confirm: "other" }).confirm, defaultMessages["validation.pattern"]);
    assert.equal(run({ confirm: matches("password", "Must match") }, { ...valid, confirm: "other" }).confirm, "Must match");
  });

  it("nested paths", () => {
    assert.deepEqual(run({ "address.city": required() }, { ...valid, address: { city: "" } }), { "address.city": defaultMessages["validation.required"] });
  });
});

describe("resolver behaviour", () => {
  it("reports only the first failing rule per field, in order", () => {
    const rules: RuleMap<Form> = { name: [required(), minLength(5), pattern(/^\d+$/)] };
    assert.equal(run(rules, { ...valid, name: "" }).name, defaultMessages["validation.required"]);
    assert.equal(run(rules, { ...valid, name: "Ada" }).name, "Enter at least 5 characters");
    assert.equal(run(rules, { ...valid, name: "Adalovelace" }).name, defaultMessages["validation.pattern"]);
  });

  it("does not run rules after the first failure", () => {
    let calls = 0;
    run({ name: [required(), custom(() => (calls += 1, undefined))] }, { ...valid, name: "" });
    assert.equal(calls, 0);
  });

  it("supports async custom rules and keeps the rule-map order", async () => {
    const slow = custom<Form>(async () => {
      await new Promise((r) => setTimeout(r, 15));
      return "taken";
    });
    const fast = custom<Form>(async () => "bad");
    const resolver: Resolver<Form> = createResolver<Form>({ name: slow, email: fast, password: required() });
    const out = resolver({ ...valid, password: "" });
    assert.ok(out instanceof Promise);
    const errors = await out;
    assert.deepEqual(Object.keys(errors), ["name", "email", "password"]);
    assert.equal(errors.name, "taken");
  });

  it("continues to later rules after an async rule passes", async () => {
    const errors = await createResolver<Form>({ name: [custom(async () => undefined), minLength(10)] })(valid);
    assert.equal(errors.name, "Enter at least 10 characters");
  });

  it("passes the whole form and the path to custom rules", () => {
    let seen: unknown;
    run({ name: custom<Form>((value, ctx) => ((seen = [value, ctx.path, ctx.values.email]), undefined)) }, valid);
    assert.deepEqual(seen, ["Ada", "name", "ada@example.com"]);
  });
});

describe("messages", () => {
  it("setValidationMessages overrides the catalog and resetValidationMessages restores it", () => {
    setValidationMessages({ "validation.required": "Obbligatorio", "validation.minLength": "Almeno {min}" });
    assert.equal(run({ name: required() }, { ...valid, name: "" }).name, "Obbligatorio");
    assert.equal(run({ name: minLength(9) }, valid).name, "Almeno 9");
    setValidationMessages({ "validation.email": "Email non valida" });
    assert.equal(run({ name: required() }, { ...valid, name: "" }).name, "Obbligatorio", "merges with earlier calls");
    resetValidationMessages();
    assert.equal(run({ name: required() }, { ...valid, name: "" }).name, defaultMessages["validation.required"]);
  });

  it("an explicit rule message beats the override", () => {
    setValidationMessages({ "validation.required": "Obbligatorio" });
    assert.equal(run({ name: required("Mine") }, { ...valid, name: "" }).name, "Mine");
  });

  it("useResolver reads the LocaleProvider catalog", () => {
    const rules: RuleMap<Form> = { name: required(), email: email() };
    const messages = { "validation.required": "Campo obbligatorio", "validation.email": "Email non valida" };
    let resolver!: Resolver<Form>;
    function Probe() {
      resolver = useResolver<Form>(rules);
      return null;
    }
    act(() => {
      TestRenderer.create(
        React.createElement(LocaleProvider, { messages }, React.createElement(Probe))
      );
    });
    assert.deepEqual(resolver({ ...valid, name: "", email: "x" }), { name: "Campo obbligatorio", email: "Email non valida" });
  });

  it("useResolver falls back to English without a provider", () => {
    let resolver!: Resolver<Form>;
    const rules: RuleMap<Form> = { name: required() };
    function Probe() {
      resolver = useResolver<Form>(rules);
      return null;
    }
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    assert.deepEqual(resolver({ ...valid, name: "" }), { name: defaultMessages["validation.required"] });
  });
});
