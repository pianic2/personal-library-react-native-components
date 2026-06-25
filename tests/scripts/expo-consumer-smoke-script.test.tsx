import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

describe("PLRNUI-58 Expo consumer smoke command", () => {
  it("exposes a deterministic Expo consumer smoke npm script", () => {
    assert.equal(
      packageJson.scripts?.["consumer:expo"],
      "node scripts/expo-consumer-smoke.mjs"
    );
  });

  it("keeps Expo consumer validation on package root and Metro semantics", () => {
    const script = readFileSync("scripts/expo-consumer-smoke.mjs", "utf8");

    assert.match(script, /@personal-library\/react-native-components/);
    assert.match(script, /expo/);
    assert.match(script, /export/);
    assert.doesNotMatch(script, /\.\.\/src|\.\.\/\.\.\/src|from ["'][^"']*src\//);
    assert.doesNotMatch(script, /\.\.\/dist|\.\.\/\.\.\/dist|from ["'][^"']*dist\//);
    assert.doesNotMatch(script, /@aura\/ui|from ["']AURA["']/);
    assert.match(script, /throw new Error/);
    assert.doesNotMatch(script, /try\s*\{[\s\S]*catch\s*\([^)]*\)\s*\{[\s\S]*console\.(warn|log)/);
  });
});
