import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/check-templates.mjs");
const LIB = "@personal-library/react-native-components";
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "templates-"));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

function valid(name = "tabs", overrides: Record<string, string | null> = {}) {
  const base: Record<string, string> = {
    [`${name}/README.md`]: "# Tabs\n",
    [`${name}/template.json`]: JSON.stringify({ name, description: "Tabs starter", version: "0.1.0" }),
    [`${name}/package.json`]: JSON.stringify({ name: `${name}-starter`, dependencies: { [LIB]: "^0.1.0" } }),
    [`${name}/app/index.tsx`]: `import { ThemeProvider } from "${LIB}/theme";\nexport default ThemeProvider;\n`,
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) delete base[`${name}/${k}`];
    else base[`${name}/${k}`] = v;
  }
  return base;
}

function run(dir: string) {
  return spawnSync(process.execPath, [script, "--root", dir], { encoding: "utf8" });
}

describe("check-templates", () => {
  it("passes on an empty fixture", () => {
    const r = run(fixture({ "_contract/.keep": "" }));
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /ok \(0 template/);
  });

  it("passes on a valid template", () => {
    const r = run(fixture(valid()));
    assert.equal(r.status, 0, r.stderr);
  });

  it("fails on a missing README", () => {
    const r = run(fixture(valid("tabs", { "README.md": null })));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /missing README\.md/);
  });

  it("fails on an empty README", () => {
    const r = run(fixture(valid("tabs", { "README.md": "  \n" })));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /README\.md is empty/);
  });

  it("fails on a deep import of the library", () => {
    const r = run(fixture(valid("tabs", { "app/index.tsx": `import { Button } from "${LIB}/src/components/Button";\n` })));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /deep import/);
  });

  it("fails when template.json name differs from the folder", () => {
    const bad = JSON.stringify({ name: "other", description: "x", version: "0.1.0" });
    const r = run(fixture(valid("tabs", { "template.json": bad })));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /must equal the folder name/);
  });

  it("fails when package.json does not depend on the library", () => {
    const r = run(fixture(valid("tabs", { "package.json": JSON.stringify({ name: "x" }) })));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /must depend on/);
  });

  it("exits 2 for a missing root", () => {
    const r = run(join(tmpdir(), "does-not-exist-templates"));
    assert.equal(r.status, 2);
  });
});
