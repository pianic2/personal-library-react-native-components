import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// PLRNUI-201: the built output must be valid ESM for Node (explicit specifiers) and its declarations must resolve under
// both moduleResolution "bundler" and "node16". The build goes to a temporary directory, so dist/ is not touched.

const root = resolve(import.meta.dirname, "../..");
const tsc = join(root, "node_modules/typescript/bin/tsc");

function build(): string {
  const out = mkdtempSync(join(tmpdir(), "dist-esm-"));
  symlinkSync(join(root, "node_modules"), join(out, "node_modules"));
  // The package is "type": "module"; the temporary copy must say so too, or Node reads dist/*.js as CommonJS.
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "module" }));
  const result = spawnSync(process.execPath, [tsc, "-p", join(root, "tsconfig.build.json"), "--outDir", join(out, "dist")], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return out;
}

function jsFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...jsFiles(full));
    else if (name.endsWith(".js")) found.push(full);
  }
  return found;
}

describe("PLRNUI-201 built output", () => {
  const out = build();
  const dist = join(out, "dist");

  it("every dist entry imports in plain node with the react-native stub", () => {
    const files = jsFiles(dist);
    assert.ok(files.length > 80, "expected the whole build");
    const runner = join(out, "runner.mjs");
    writeFileSync(runner, `import { pathToFileURL } from "node:url"; const failures = []; for (const file of JSON.parse(process.argv[2])) { try { await import(pathToFileURL(file).href); } catch (error) { failures.push(file + ": " + (error?.message ?? error)); } } console.log(JSON.stringify(failures));`);
    const result = spawnSync(process.execPath, ["--import", pathToFileURL(join(root, "tests/shims/register-rn-stub.mjs")).href, runner, JSON.stringify(files)], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout.trim().split("\n").pop() as string), []);
  });

  it("the package entry imports through the acceptance command", () => {
    const result = spawnSync(process.execPath, ["--import", pathToFileURL(join(root, "tests/shims/register-rn-stub.mjs")).href, "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(dist, "index.js")).href)}); if (Object.keys(m).length < 50) process.exit(3);`], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  });

  /** Errors that tsc reports for files under dist/ (library noise from node_modules is not part of this contract). */
  function distErrors(resolution: "bundler" | "node16"): string[] {
    const fixture = join(out, `fixture-${resolution}.ts`);
    writeFileSync(fixture, `import { Button, ThemeProvider } from "./dist/index.js";\nexport const parts = [Button, ThemeProvider];\n`);
    const module = resolution === "node16" ? "node16" : "esnext";
    const result = spawnSync(process.execPath, [tsc, "--noEmit", "--strict", "--jsx", "react-jsx", "--module", module, "--moduleResolution", resolution, "--target", "es2022", fixture], { cwd: out, encoding: "utf8" });
    return `${result.stdout}${result.stderr}`.split("\n").filter((line) => /(^|[\\/])(dist|fixture-[a-z0-9]+\.ts)[\\/(]/.test(line) || line.startsWith("fixture-") || line.startsWith("dist/"));
  }

  for (const resolution of ["bundler", "node16"] as const) {
    it(`declarations resolve under moduleResolution ${resolution}`, () => {
      assert.deepEqual(distErrors(resolution), []);
    });
  }

  it("the node16 check does fail when a declaration has an extensionless relative specifier", () => {
    const index = join(dist, "index.d.ts");
    const original = readFileSync(index, "utf8");
    const mutated = original.replace(/(from "\.\/components\/Button)\/index\.js"/, '$1"');
    assert.notEqual(mutated, original, "expected a Button re-export in dist/index.d.ts");
    writeFileSync(index, mutated);
    try {
      const errors = distErrors("node16");
      assert.ok(errors.some((line) => /TS2834|TS2835/.test(line)), `expected TS2834/TS2835, got: ${errors.join("\n")}`);
    } finally {
      writeFileSync(index, original);
    }
  });

  it("cleans up", () => {
    rmSync(out, { recursive: true, force: true });
  });
});
