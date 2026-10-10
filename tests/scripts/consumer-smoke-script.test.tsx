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

  it("compiles the packed declarations under a tsconfig matrix with skipLibCheck false", () => {
    const script = readFileSync("scripts/consumer-smoke.mjs", "utf8");
    const matrix = /const tsconfigMatrix = \[([\s\S]*?)\n\];/.exec(script)?.[1] ?? "";
    const names = [...matrix.matchAll(/name: "([\w-]+)"/g)].map((m) => m[1]);
    assert.ok(names.length >= 3, `matrix has ${names.length} variants`);
    for (const required of ["nodenext", "node16", "bundler"]) assert.ok(names.includes(required), required);
    assert.match(matrix, /moduleResolution: "Bundler"/);
    assert.match(matrix, /isolatedModules: true/);
    // Every variant is compiled with skipLibCheck false, and the matrix is part of the consumer validation.
    assert.match(script, /skipLibCheck: false/);
    assert.match(script, /"typecheck:matrix": tsconfigMatrix\.map/);
    assert.match(script, /run\("npm", \["run", "typecheck:matrix"\]/);
    // skipLibCheck stays true only in the default tsconfig.json, never in a matrix variant.
    const variantBlock = /for \(const variant of tsconfigMatrix\) \{([\s\S]*?)\n  \}/.exec(script)?.[1] ?? "";
    assert.doesNotMatch(variantBlock, /skipLibCheck: true/);
  });
});
