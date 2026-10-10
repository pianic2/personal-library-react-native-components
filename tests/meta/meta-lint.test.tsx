import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "lib", "meta.mjs");

function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
}

const valid = {
  name: "Foo",
  category: "layout",
  status: "demo",
  summary: "A fixture component.",
  whenToUse: ["Testing"],
  whenNotToUse: [],
  composition: { parents: [], children: [], pairsWith: [] },
  a11y: [],
  variants: {},
  states: ["default"],
  platformNotes: [],
  examples: [{ title: "Foo", code: "<Foo />" }],
};

/** Creates a temporary repo root with the given components (name -> meta object or raw file text). */
function fixture(components: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "plrnui-166-"));
  for (const [name, meta] of Object.entries(components)) {
    const folder = join(dir, "src", "components", name);
    mkdirSync(folder, { recursive: true });
    if (meta === null) continue;
    const text = typeof meta === "string" ? meta : `export const meta = ${JSON.stringify(meta)};\n`;
    writeFileSync(join(folder, `${name}.meta.ts`), text);
  }
  return dir;
}

function lint(components: Record<string, unknown>, ...flags: string[]) {
  const dir = fixture(components);
  try {
    return spawnSync(process.execPath, [cli, "--root", dir, ...flags], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("PLRNUI-166 component metadata", () => {
  it("lints the repository: one meta file per component directory", () => {
    const dirs = readdirSync(join(root, "src", "components"), { withFileTypes: true }).filter((e) => e.isDirectory());
    assert.equal(dirs.length, 36);
    for (const dir of dirs) assert.ok(existsSync(join(root, "src", "components", dir.name, `${dir.name}.meta.ts`)), dir.name);
    const result = run(["--lint"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(run(["--strict"]).status, 0);
  });

  it("--json prints every entry sorted, with the maturity audit counts and at least one state and example each", () => {
    const result = run(["--json"]);
    assert.equal(result.status, 0, result.stderr);
    const entries = JSON.parse(result.stdout) as Array<{ name: string; status: string; states: string[]; examples: unknown[]; file: string }>;
    assert.equal(entries.length, 36);
    assert.deepEqual(entries.map((e) => e.name), [...entries.map((e) => e.name)].sort());
    assert.equal(entries.filter((e) => e.status === "demo").length, 18);
    assert.equal(entries.filter((e) => e.status === "prototype").length, 18);
    for (const entry of entries) {
      assert.ok(entry.states.length >= 1, entry.name);
      assert.ok(entry.examples.length >= 1, entry.name);
    }
    assert.equal(run(["--json"]).stdout, result.stdout, "deterministic output");
  });

  it("Button has the full reference entry", () => {
    const entries = JSON.parse(run(["--json"]).stdout) as Array<Record<string, any>>;
    const button = entries.find((e) => e.name === "Button")!;
    assert.deepEqual(button.variants.variant, ["primary", "secondary", "ghost", "danger", "info"]);
    assert.ok(button.whenToUse.length >= 2 && button.whenNotToUse.length >= 1 && button.a11y.length >= 1);
  });

  it("accepts a valid fixture", () => {
    assert.equal(lint({ Foo: valid }).status, 0);
  });

  it("fails when whenNotToUse.instead names a non-existent component", () => {
    const result = lint({ Foo: { ...valid, whenNotToUse: [{ reason: "no", instead: "Ghost" }] } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /non-existent component "Ghost"/);
  });

  it("fails on composition references, name mismatch, status, summary length, unknown key", () => {
    const cases: Array<[Record<string, unknown>, RegExp]> = [
      [{ ...valid, composition: { parents: ["Ghost"], children: [], pairsWith: [] } }, /composition\.parents names a non-existent/],
      [{ ...valid, name: "Bar" }, /name must equal the directory name/],
      [{ ...valid, status: "beta" }, /status must be one of/],
      [{ ...valid, summary: "x".repeat(141) }, /summary must be 1\.\.140/],
      [{ ...valid, extra: 1 }, /unknown key "extra"/],
      [{ ...valid, states: [] }, /states must list at least one/],
      [{ ...valid, examples: [] }, /examples must list at least one/],
      [{ ...valid, examples: [{ title: "x", path: "missing/file.tsx" }] }, /example path does not exist/],
      [{ ...valid, examples: [{ title: "x", path: "../outside.tsx" }] }, /must stay inside the repository/],
      [{ ...valid, examples: [{ title: "x", path: "/etc/hosts" }] }, /must stay inside the repository/],
    ];
    for (const [meta, pattern] of cases) {
      const result = lint({ Foo: meta });
      assert.equal(result.status, 1, JSON.stringify(meta));
      assert.match(result.stderr, pattern);
    }
  });

  it("fails on a missing meta file and on non-JSON values", () => {
    const missing = lint({ Foo: null });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /missing meta file/);
    const fn = lint({ Foo: `export const meta = { ...${JSON.stringify(valid)}, extra: () => 1 };\n` });
    assert.equal(fn.status, 2);
    assert.match(fn.stderr, /not plain JSON data/);
  });

  it("--strict adds the stricter bar", () => {
    assert.equal(lint({ Foo: { ...valid, whenToUse: [] } }).status, 0);
    const strict = lint({ Foo: { ...valid, whenToUse: [] } }, "--strict");
    assert.equal(strict.status, 1);
    assert.match(strict.stderr, /\[strict\] whenToUse/);
    const promoted = lint({ Foo: { ...valid, status: "stable" } }, "--strict");
    assert.equal(promoted.status, 1);
    assert.match(promoted.stderr, /stable components must document accessibility/);
  });

  it("exits 2 on usage errors, unreadable input and files that cannot run", () => {
    assert.equal(run(["--nope"]).status, 2);
    assert.equal(run(["--root"]).status, 2);
    assert.equal(lint({ Foo: "export const meta = {" }).status, 2);
    assert.equal(lint({ Foo: 'import x from "fs"; export const meta = x;' }).status, 2);
    assert.equal(lint({ Foo: "export const meta = (() => { while (true) {} })();" }).status, 2);
  });

  it("reads each property once as plain data: getters, proxies and toJSON cannot change what the lint sees or hang it", () => {
    const flip = `let reads = 0;\nexport const meta = { ...${JSON.stringify(valid)}, get summary() { reads += 1; return reads < 5 ? "ok" : "x".repeat(500); } };\n`;
    // One read per property: the value the lint checks is the value --json prints.
    assert.equal(lint({ Foo: flip }).status, 0);
    const printed = lint({ Foo: flip }, "--json");
    assert.equal(printed.status, 0);
    assert.equal((JSON.parse(printed.stdout) as Array<{ summary: string }>)[0].summary, "ok");
    const hang = `export const meta = { ...${JSON.stringify(valid)}, get summary() { while (true) {} } };\n`;
    assert.equal(lint({ Foo: hang }).status, 2);
    const toJson = `export const meta = { ...${JSON.stringify(valid)}, toJSON() { while (true) {} } };\n`;
    assert.equal(lint({ Foo: toJson }).status, 2);
    const hostile = [
      "JSON.stringify = () => ({ toString() { for (;;); } });",
      "Object.defineProperty(module, 'exports', { get() { for (;;); } });",
      "Object.defineProperty(globalThis, 'snapshotSource', { set() { for (;;); } });",
      "Array.from = () => { for (;;); };",
      "Object.keys = () => { for (;;); };",
    ];
    for (const code of hostile) {
      const result = lint({ Foo: `${code}\nexport const meta = ${JSON.stringify(valid)};\n` });
      assert.ok(result.status === 0 || result.status === 2, `${code}: ${result.status}`);
      assert.notEqual(result.signal, "SIGTERM");
    }
    // A proxy is snapshotted once like any object, so what the lint checks is what --json prints.
    const proxy = `export const meta = new Proxy(${JSON.stringify(valid)}, {});\n`;
    assert.equal(lint({ Foo: proxy }).status, 0);
  });

  it("cannot be made to pass by a meta file: no process access, so no exit or output tampering", () => {
    const sneaky = lint({
      Foo: { ...valid, whenNotToUse: [{ reason: "no", instead: "Ghost" }] },
      Bar: 'export const meta = (() => { process.exit(0); return {}; })();',
    });
    assert.equal(sneaky.status, 2);
    assert.match(sneaky.stderr, /cannot evaluate/);
    for (const escape of [
      "(exports.constructor.constructor('return process')()).exit(0);",
      "(this.constructor.constructor('return process')()).exit(0);",
      "(module.constructor('return process')()).exit(0);",
      "Promise.resolve().then(() => { while (true) {} });",
    ]) {
      const result = lint({
        Foo: { ...valid, whenNotToUse: [{ reason: "no", instead: "Ghost" }] },
        Bar: `${escape}\nexport const meta = {};`,
      });
      assert.notEqual(result.status, 0, escape);
    }
  });

  it("keeps metadata out of the build, the root entry and component code", () => {
    const out = mkdtempSync(join(tmpdir(), "plrnui-166-build-"));
    try {
      const build = spawnSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json", "--outDir", out], { cwd: root, encoding: "utf8" });
      assert.equal(build.status, 0, build.stdout + build.stderr);
      const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
      const emitted = files(out);
      assert.ok(emitted.length > 100);
      assert.deepEqual(emitted.filter((f) => /\.meta\./.test(f)), []);
      assert.equal(existsSync(join(out, "meta")), false);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
    assert.doesNotMatch(readFileSync(join(root, "src", "index.ts"), "utf8"), /meta/);
    for (const file of readdirSync(join(root, "src", "components"), { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(file) || file.endsWith(".meta.ts")) continue;
      assert.doesNotMatch(readFileSync(join(root, "src", "components", file), "utf8"), /\.meta(\.js)?["']/, file);
    }
  });
});
