import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// PLRNUI-244: ai/examples holds one short, compile-checked example per component exported from the package root.
const root = resolve(import.meta.dirname, "../..");
const examplesDir = join(root, "ai/examples");
const tsc = createRequire(import.meta.url).resolve("typescript/lib/tsc.js");

/** Component directories whose values src/index.ts re-exports (the same rule the maturity gate uses for "exported"). */
function exportedComponentDirs(): string[] {
  const index = readFileSync(join(root, "src/index.ts"), "utf8");
  const dirs = new Set<string>();
  for (const match of index.matchAll(/^export \{[^}]*\} from "\.\/components\/(\w+)\/index\.js";/gm)) dirs.add(match[1]!);
  return [...dirs].sort();
}

const files = () => readdirSync(examplesDir).filter((f) => f.endsWith(".tsx")).sort();
const nonBlank = (text: string) => text.split("\n").filter((line) => line.trim() !== "").length;

describe("PLRNUI-244 ai examples", () => {
  it("the root entry exports components (guards the rule below)", () => {
    assert.ok(exportedComponentDirs().length >= 30);
  });

  it("every component exported from the package root has an example", () => {
    const have = new Set(files().map((f) => f.replace(/\.tsx$/, "")));
    const missing = exportedComponentDirs().filter((dir) => !have.has(dir));
    assert.deepEqual(missing, [], `add ai/examples/<Name>.tsx for: ${missing.join(", ")}`);
  });

  it("there is no example for a component that is not exported from the root", () => {
    const exported = new Set(exportedComponentDirs());
    const extra = files().map((f) => f.replace(/\.tsx$/, "")).filter((name) => !exported.has(name));
    assert.deepEqual(extra, []);
  });

  it("each example has at most 25 non-blank lines, the @ai-example marker first, and exports <Name>Example", () => {
    for (const file of files()) {
      const text = readFileSync(join(examplesDir, file), "utf8");
      const name = file.replace(/\.tsx$/, "");
      assert.ok(nonBlank(text) <= 25, `${file} has ${nonBlank(text)} non-blank lines`);
      assert.equal(text.split("\n")[0], "// @ai-example", `${file} must start with the marker`);
      assert.match(text, new RegExp(`export function ${name}Example\\(`), `${file} must export ${name}Example`);
    }
  });

  it("examples import only from the package root", () => {
    for (const file of files()) {
      const specs = [...readFileSync(join(examplesDir, file), "utf8").matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
      for (const spec of specs) assert.ok(spec === "react" || spec === "@personal-library/react-native-components", `${file} imports ${spec}`);
    }
  });

  it("tsc -p ai/tsconfig.examples.json --noEmit passes", () => {
    const result = spawnSync(process.execPath, [tsc, "-p", "ai/tsconfig.examples.json", "--noEmit"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it("the example config does fail on a type error (it really checks)", () => {
    const dir = mkdtempSync(join(tmpdir(), "ai-examples-"));
    try {
      writeFileSync(join(dir, "bad.tsx"), 'import { Button } from "@personal-library/react-native-components";\nexport const bad = <Button label={1} />;\n');
      writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ extends: join(root, "ai/tsconfig.examples.json"), include: [join(dir, "bad.tsx")] }));
      const result = spawnSync(process.execPath, [tsc, "-p", join(dir, "tsconfig.json"), "--noEmit"], { cwd: root, encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /bad\.tsx/);
      assert.match(result.stdout, /TS2322/, "the intended type error (label must be a string) is reported");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
