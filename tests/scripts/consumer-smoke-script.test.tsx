import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

describe("PLRNUI-46 consumer smoke command", () => {
  it("exposes a deterministic consumer smoke npm script", () => {
    assert.equal(
      packageJson.scripts?.["consumer:smoke"],
      "node scripts/consumer-smoke.mjs"
    );
  });

  it("keeps consumer validation outside source and package internals", () => {
    const script = readFileSync("scripts/consumer-smoke.mjs", "utf8");

    assert.match(script, /@personal-library\/react-native-components/);
    assert.doesNotMatch(script, /\.\.\/src|\.\.\/\.\.\/src|from ["'][^"']*src\//);
    assert.doesNotMatch(script, /@aura\/ui|from ["']AURA["']/);
  });
});
