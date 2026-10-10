import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

  const app = (code: string) => valid("tabs", { "app/index.tsx": code });
  const pkg = (extra: Record<string, unknown>) =>
    valid("tabs", { "package.json": JSON.stringify({ name: "x", dependencies: { [LIB]: "^0.1.0" }, ...extra }) });
  const lib = (deps: Record<string, string>) => valid("tabs", { "package.json": JSON.stringify({ name: "x", dependencies: deps }) });

  function expectFail(files: Record<string, string>, pattern: RegExp) {
    const r = run(fixture(files));
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, pattern);
  }

  it("fails on a symlinked source file", () => {
    const dir = fixture(valid());
    writeFileSync(join(dir, "real.ts"), "export {};\n");
    symlinkSync(join(dir, "real.ts"), join(dir, "tabs/app/linked.ts"));
    const r = run(dir);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /symlinks are not allowed/);
  });

  it("fails on a symlinked directory", () => {
    const dir = fixture(valid());
    mkdirSync(join(dir, "outside"));
    writeFileSync(join(dir, "outside/x.ts"), `import "${LIB}/src/x";\n`);
    symlinkSync(join(dir, "outside"), join(dir, "tabs/app/linkdir"));
    const r = run(dir);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /symlinks are not allowed/);
  });

  it("fails on a symlinked app/ directory", () => {
    const dir = fixture(valid("tabs", { "app/index.tsx": null }));
    mkdirSync(join(dir, "elsewhere"));
    writeFileSync(join(dir, "elsewhere/i.ts"), "export {};\n");
    symlinkSync(join(dir, "elsewhere"), join(dir, "tabs/app"));
    const r = run(dir);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /symlinks are not allowed/);
  });

  it("fails on template-literal import and require of a deep path", () => {
    expectFail(app("const a = await import(`" + LIB + "/src/x`);\n"), /deep import/);
    expectFail(app("const a = require(`" + LIB + "/dist/x`);\n"), /deep import/);
  });

  it("fails on import() with a with-clause or a trailing comma", () => {
    expectFail(app(`const a = import("${LIB}/src/x", { with: { type: "json" } });\n`), /deep import/);
    expectFail(app(`const a = import("${LIB}/src/x",);\n`), /deep import/);
  });

  it("fails on require.resolve, jest.requireActual and jest.mock deep paths", () => {
    expectFail(app(`require.resolve("${LIB}/src/x");\n`), /deep import/);
    expectFail(app(`jest.requireActual("${LIB}/src/x");\n`), /deep import/);
    expectFail(app(`jest.mock("${LIB}/dist/x");\n`), /deep import/);
  });

  it("fails on variable and interpolated specifiers", () => {
    expectFail(app("const m = 'x';\nrequire(m);\n"), /dynamic import\/require/);
    expectFail(app("const m = 'x';\nawait import(m);\n"), /dynamic import\/require/);
    expectFail(app("await import(`${LIB}/${m}`);\n"), /dynamic import\/require/);
  });

  it("fails on a deep export ... from and on a comment between import and from", () => {
    expectFail(app(`export * from "${LIB}/src/x";\n`), /deep import/);
    expectFail(app(`import { a } /* c */ from "${LIB}/src/x";\n`), /deep import/);
    expectFail(app(`import {\n a, // c\n} from "${LIB}/src/x";\n`), /deep import/);
  });

  it("does not flag a deep path that only appears in a comment", () => {
    const r = run(fixture(app(`// import "${LIB}/src/x"\nexport default 1;\n`)));
    assert.equal(r.status, 0, r.stderr);
  });

  it("fails on absolute and escaping relative imports, including backslashes", () => {
    expectFail(app(`import "/etc/passwd";\n`), /absolute import/);
    expectFail(app(`import x from "../../src/x";\n`), /escapes the template folder/);
    expectFail(app(`import x from "..\\\\..\\\\src\\\\x";\n`), /escapes the template folder/);
  });

  it("scans .mdx files", () => {
    expectFail(valid("tabs", { "app/doc.mdx": `import { A } from "${LIB}/src/a";\n` }), /deep import/);
  });

  it("fails on non-semver library specs in any dependency section", () => {
    expectFail(pkg({ peerDependencies: { [LIB]: "file:../../" } }), /semver range/);
    expectFail(pkg({ devDependencies: { [LIB]: "file:../../" } }), /semver range/);
    expectFail(pkg({ optionalDependencies: { [LIB]: "../.." } }), /semver range/);
    expectFail(lib({ [LIB]: "github:o/r" }), /semver range/);
    expectFail(lib({ [LIB]: "npm:other@1.0.0" }), /semver range/);
    expectFail(lib({ [LIB]: "*" }), /semver range/);
    expectFail(lib({ [LIB]: "FILE:../.." }), /semver range/);
    expectFail(pkg({ overrides: { [LIB]: "file:../.." } }), /semver range/);
    expectFail(pkg({ resolutions: { [LIB]: "link:../.." } }), /semver range/);
    expectFail(pkg({ devDependencies: { alias: `npm:${LIB}@1.0.0` } }), /aliases/);
  });

  it("accepts semver ranges for the library", () => {
    const r = run(fixture(lib({ [LIB]: ">=0.1.0 <1.0.0 || ^2.0.0-rc.1" })));
    assert.equal(r.status, 0, r.stderr);
  });

  it("fails on node_modules or build directories inside a template", () => {
    expectFail(valid("tabs", { "node_modules/x/index.js": "export {};\n" }), /must not be present/);
    expectFail(valid("tabs", { "app/dist/a.js": "export {};\n" }), /must not be present/);
  });

  it("fails on a bad version, non-kebab name, stray root file, missing app/, template.json, package.json", () => {
    const bad = JSON.stringify({ name: "tabs", description: "d", version: "1.0" });
    expectFail(valid("tabs", { "template.json": bad }), /x\.y\.z/);
    expectFail(valid("MyTabs"), /kebab-case/);
    expectFail({ ...valid(), "stray.txt": "x" }, /unexpected file/);
    expectFail(valid("tabs", { "app/index.tsx": null }), /missing app\/ directory/);
    expectFail(valid("tabs", { "template.json": null }), /missing template\.json/);
    expectFail(valid("tabs", { "package.json": null }), /missing package\.json/);
  });

  it("exits 2 for a missing --package-json and honours a custom one", () => {
    const dir = fixture(valid());
    const missing = spawnSync(process.execPath, [script, "--root", dir, "--package-json", join(dir, "nope.json")], { encoding: "utf8" });
    assert.equal(missing.status, 2);
    const other = join(dir, "other.json");
    writeFileSync(other, JSON.stringify({ name: "@other/lib" }));
    const r = spawnSync(process.execPath, [script, "--root", dir, "--package-json", other], { encoding: "utf8" });
    assert.equal(r.status, 1, "template depends on a different library name");
    assert.match(r.stderr, /must depend on @other\/lib/);
  });
});
