import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { compatActive, legacy, legacyTheme, legacyTokens } from "./api.js";

const root = resolve(import.meta.dirname, "../..");
const target = process.env.COMPAT_TARGET ?? (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { name: string }).name;
// Under the compat loader `target` is the built package (dist); under plain `npm test` it is the source API.
const built = (compatActive ? await import(target) : legacy) as Record<string, unknown>;
const builtTheme = (compatActive ? await import(`${target}/theme`) : legacyTheme) as Record<string, unknown>;
const builtTokens = (compatActive ? await import(`${target}/tokens`) : legacyTokens) as Record<string, unknown>;

// Value exports of the public API snapshot (types are erased at runtime and are not listed by the snapshot).
const snapshot = readFileSync(join(root, "audit", "api", "public-root-api.snapshot"), "utf8");

describe("PLRNUI-162 legacy specifier: public surface", () => {
  it("exposes exactly the exports of the built target", () => {
    assert.deepEqual(Object.keys(legacy).sort(), Object.keys(built).sort());
    assert.deepEqual(Object.keys(legacyTheme).sort(), Object.keys(builtTheme).sort());
    assert.deepEqual(Object.keys(legacyTokens).sort(), Object.keys(builtTokens).sort());
  });

  it("re-exports the same values (identity), not copies", () => {
    for (const key of Object.keys(built)) assert.equal((legacy as Record<string, unknown>)[key], built[key], key);
  });

  it("still exposes every export listed in the public API snapshot, and fences internal helpers", () => {
    const missing = snapshot
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(line))
      .filter((name) => name in built && !(name in legacy));
    assert.deepEqual(missing, []);
    for (const name of ["Button", "ThemeProvider", "Text", "Input", "useTheme"]) assert.ok(name in legacy, name);
    assert.equal("cn" in legacy, false);
    assert.equal("useIsMounted" in legacy, false);
  });
});
