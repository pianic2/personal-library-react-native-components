import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

  it("reports a deep import that only appears in a comment (documented fail-closed false positive)", () => {
    expectFail(app(`// import "${LIB}/src/x"\nexport default 1;\n`), /deep import/);
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

  it("detects imports after regex literals, JSX apostrophes, nested templates and fake comment markers", () => {
    expectFail(app(`const r = /'/; const u = 'http://x'; import('${LIB}/src/x');\n`), /deep import/);
    expectFail(app(`const a = <Text>don't</Text>; const u = 'http://x'; require('${LIB}/src/x');\n`), /deep import/);
    expectFail(app("const a = `${ `'` }`;\nconst b = '//'; import('" + LIB + "/src/x');\n"), /deep import/);
    expectFail(app(`const a = '/*';\nimport('${LIB}/src/x');\nconst b = '*/';\n`), /deep import/);
  });

  it("fails on string-named bindings importing from a deep path", () => {
    expectFail(app(`import { "a-b" as c } from '${LIB}/src/x';\n`), /deep import/);
    expectFail(app(`export { "a" as b } from '${LIB}/src/x';\n`), /deep import/);
  });

  it("fails on overrides/resolutions keys of the form name@range and variants", () => {
    expectFail(pkg({ overrides: { [`${LIB}@^0.1.0`]: "link:../x" } }), /semver range/);
    expectFail(pkg({ resolutions: { [`${LIB}@^0.1.0`]: "link:../x" } }), /semver range/);
    expectFail(pkg({ resolutions: { [`**/${LIB}@^0.1.0`]: "file:../x" } }), /semver range/);
    expectFail(pkg({ resolutions: { [`foo>${LIB}@1`]: "file:../x" } }), /semver range/);
    expectFail(lib({ [LIB]: "^0.1.0", [`${LIB}@1`]: "^0.1.0" }), /non-canonical/);
  });

  it("fails on import.meta.resolve and createRequire", () => {
    expectFail(app(`const u = import.meta.resolve('${LIB}/src/x');\n`), /import\.meta\.resolve/);
    expectFail(app(`import { createRequire } from 'node:module';\n`), /createRequire/);
  });

  it("scans other extensions case-insensitively", () => {
    expectFail(valid("tabs", { "app/x.TS": `import "${LIB}/src/x";\n` }), /deep import/);
    expectFail(valid("tabs", { "app/x.vue": `import "${LIB}/src/x";\n` }), /deep import/);
    expectFail(valid("tabs", { "app/x.html": `<script>import "${LIB}/src/x";</script>\n` }), /deep import/);
  });

  it("fails on workspaces and bundledDependencies", () => {
    expectFail(pkg({ workspaces: ["packages/*"] }), /workspaces/);
    expectFail(pkg({ bundledDependencies: [LIB] }), /bundledDependencies/);
  });
});

// `--build <name>` runs npm for real (pack, install, expo export). These tests put a fake `npm` first on the PATH that
// records its calls and produces what the real one would, so the orchestration is checked without a network.
describe("check-templates --build", () => {
  function fakeNpm() {
    const bin = mkdtempSync(join(tmpdir(), "fake-npm-"));
    dirs.push(bin);
    const log = join(bin, "calls.log");
    writeFileSync(
      join(bin, "npm"),
      `#!/bin/sh
echo "$PWD :: $*" >> "${log}"
case "$1" in
  install) [ "$FAKE_NPM_FAIL" = install ] && exit 3 ;;
  run) [ "$FAKE_NPM_FAIL" = "$2" ] && exit 4 ;;
  pack)
    dest=""
    while [ $# -gt 0 ]; do [ "$1" = "--pack-destination" ] && dest="$2"; shift; done
    [ "$FAKE_NPM_FAIL" = pack ] && exit 5
    [ "$FAKE_NPM_PACK" = none ] && exit 0
    : > "$dest/fake-lib-0.0.0.tgz"
    [ "$FAKE_NPM_PACK" = two ] && : > "$dest/second-0.0.0.tgz"
    exit 0 ;;
  exec)
    [ "$FAKE_NPM_FAIL" = export ] && exit 6
    [ "$FAKE_NPM_EXPORT" = empty ] && exit 0
    mkdir -p dist-web/_expo/static/js/web
    if [ "$FAKE_NPM_EXPORT" = noroot ]; then echo '<!doctype html><script src="/_expo/static/js/web/index.js"></script>' > dist-web/index.html
    else echo '<!doctype html><div id="root"></div><script src="/_expo/static/js/web/index.js"></script>' > dist-web/index.html; fi
    if [ "$FAKE_NPM_EXPORT" = emptybundle ]; then : > dist-web/_expo/static/js/web/index.js; else echo 'console.log(1)' > dist-web/_expo/static/js/web/index.js; fi ;;
esac
exit 0
`,
    );
    chmodSync(join(bin, "npm"), 0o755);
    return { bin, calls: () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : []) };
  }

  function build(dir: string, name: string, fake: ReturnType<typeof fakeNpm>, env: Record<string, string> = {}, extra: string[] = []) {
    const work = mkdtempSync(join(tmpdir(), "tpl-work-"));
    dirs.push(work);
    const result = spawnSync(process.execPath, [script, "--root", dir, "--build", name, "--work-dir", join(work, "w"), ...extra], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${fake.bin}:${process.env.PATH}`, ...env },
    });
    return { ...result, work: join(work, "w") };
  }

  const withScripts = (scripts: Record<string, string> | undefined) =>
    valid("tabs", { "package.json": JSON.stringify({ name: "tabs-starter", ...(scripts ? { scripts } : {}), dependencies: { [LIB]: "^0.1.0", expo: "57.0.21" } }) });

  it("packs the library, installs the copy with the library pointing at the tarball, typechecks, exports and checks the export", () => {
    const fake = fakeNpm();
    const r = build(fixture(withScripts({ typecheck: "tsc --noEmit" })), "tabs", fake);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /build ok \(tabs\)/);
    const commands = fake.calls().map((line) => line.split(" :: ")[1]);
    assert.deepEqual(commands, [
      "run build",
      `pack --pack-destination ${join(r.work, "artifacts")}`,
      "install --no-audit --no-fund --ignore-scripts --prefer-offline",
      "run typecheck",
      "exec -- expo export --platform web --output-dir dist-web",
    ]);
    const copied = JSON.parse(readFileSync(join(r.work, "app/package.json"), "utf8"));
    assert.equal(copied.dependencies[LIB], `file:${join(r.work, "artifacts/fake-lib-0.0.0.tgz")}`);
    assert.equal(copied.dependencies.expo, "57.0.21", "other dependencies are kept");
    assert.ok(existsSync(join(r.work, "app/app/index.tsx")), "the template sources are copied");
  });

  it("the template folder itself is not changed (the dependency stays a semver range)", () => {
    const fake = fakeNpm();
    const dir = fixture(withScripts(undefined));
    const before = readFileSync(join(dir, "tabs/package.json"), "utf8");
    assert.equal(build(dir, "tabs", fake).status, 0);
    assert.equal(readFileSync(join(dir, "tabs/package.json"), "utf8"), before);
  });

  it("skips the typecheck when the template has no typecheck script", () => {
    const fake = fakeNpm();
    const r = build(fixture(withScripts(undefined)), "tabs", fake);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(!fake.calls().some((line) => line.endsWith("run typecheck")));
  });

  it("does not build when the contract check fails", () => {
    const fake = fakeNpm();
    const r = build(fixture(valid("tabs", { "README.md": null })), "tabs", fake);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /missing README\.md/);
    assert.deepEqual(fake.calls(), []);
  });

  it("exits 2 for a template that does not exist, and for _contract", () => {
    const fake = fakeNpm();
    const dir = fixture({ ...valid(), "_contract/README.md": "x\n" });
    assert.equal(build(dir, "nope", fake).status, 2);
    assert.equal(build(dir, "_contract", fake).status, 2);
    assert.deepEqual(fake.calls(), []);
  });

  it("exits 2 for bad arguments", () => {
    const dir = fixture(valid());
    for (const args of [["--build"], ["--build", "Bad_Name"], ["--work-dir", "/tmp/x"], ["--build", "tabs", "--work-dir"]]) {
      const r = spawnSync(process.execPath, [script, "--root", dir, ...args], { encoding: "utf8" });
      assert.equal(r.status, 2, args.join(" "));
    }
  });

  for (const step of ["build", "pack", "install", "typecheck", "export"]) {
    it(`fails closed when ${step} fails`, () => {
      const fake = fakeNpm();
      const r = build(fixture(withScripts({ typecheck: "tsc" })), "tabs", fake, { FAKE_NPM_FAIL: step });
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stderr, /FAIL build tabs: npm .* exited with \d/);
    });
  }

  it("fails when the export produces nothing, no root element, or an empty bundle", () => {
    const cases: Array<[string, RegExp]> = [
      ["empty", /no index\.html/],
      ["noroot", /id="root"/],
      ["emptybundle", /no non-empty \.js bundle/],
    ];
    for (const [mode, pattern] of cases) {
      const r = build(fixture(withScripts(undefined)), "tabs", fakeNpm(), { FAKE_NPM_EXPORT: mode });
      assert.equal(r.status, 1, `${mode}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, pattern, mode);
    }
  });

  it("fails when npm pack leaves no tarball, or more than one", () => {
    for (const mode of ["none", "two"]) {
      const r = build(fixture(withScripts(undefined)), "tabs", fakeNpm(), { FAKE_NPM_PACK: mode });
      assert.equal(r.status, 1, mode);
      assert.match(r.stderr, /expected exactly one packed tarball/, mode);
    }
  });

  it("builds the real tabs template contract (the starter in this repository passes the contract check)", () => {
    const r = spawnSync(process.execPath, [script], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  });
});
