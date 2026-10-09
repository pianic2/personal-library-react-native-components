import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
// @ts-expect-error plain ESM script without type declarations
import { assertMatchesPackageJson, identity, legacyName, packageName, readIdentity, shimEnabled, validateIdentity } from "../../scripts/lib/identity.mjs";

const root = resolve(import.meta.dirname, "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dirs: string[] = [];

function writeTemp(name: string, content: unknown) {
  const dir = mkdtempSync(join(tmpdir(), "identity-"));
  dirs.push(dir);
  const file = join(dir, name);
  writeFileSync(file, typeof content === "string" ? content : JSON.stringify(content));
  return file;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

const valid = { current: "@scope/pkg", legacy: null, shim: { enabled: false } };

describe("PLRNUI-215 package identity", () => {
  it("identity.current equals the package.json name", () => {
    assert.equal(identity.current, pkg.name);
    assert.equal(packageName(), pkg.name);
    assert.equal(assertMatchesPackageJson(identity), pkg.name);
  });

  it("holds only the current name today: no legacy name, shim disabled", () => {
    assert.equal(legacyName(), null);
    assert.equal(shimEnabled(), false);
    assert.deepEqual(JSON.parse(readFileSync(join(root, "config", "package-identity.json"), "utf8")), {
      current: pkg.name,
      legacy: null,
      shim: { enabled: false },
    });
  });

  it("running the module prints the current name", () => {
    const result = spawnSync(process.execPath, [join(root, "scripts", "lib", "identity.mjs")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), pkg.name);
  });

  it("importing the module exposes the name", () => {
    const result = spawnSync(process.execPath, ["-e", "import('./scripts/lib/identity.mjs').then(m => console.log(m.identity.current))"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), pkg.name);
  });

  it("importing the module from another script prints nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "identity-main-"));
    dirs.push(dir);
    const main = join(dir, "main.mjs");
    writeFileSync(main, `import { packageName } from ${JSON.stringify(join(root, "scripts", "lib", "identity.mjs"))};\nif (typeof packageName() !== "string") process.exit(1);\n`);
    const result = spawnSync(process.execPath, [main], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
  });

  it("rejects a __proto__ key and keeps the last of duplicate keys (documented limit)", () => {
    assert.throws(() => readIdentity(writeTemp("proto.json", '{"current":"@s/p","legacy":null,"shim":{"enabled":false},"__proto__":{}}')), /unknown key/);
    assert.equal(readIdentity(writeTemp("dup.json", '{"current":"@a/b","current":"@c/d","legacy":null,"shim":{"enabled":false}}')).current, "@c/d");
  });

  it("the identity is frozen", () => {
    assert.ok(Object.isFrozen(identity) && Object.isFrozen(identity.shim));
  });

  it("accepts a valid identity and a legacy name with the shim enabled", () => {
    assert.equal(readIdentity(writeTemp("ok.json", valid)).current, "@scope/pkg");
    const shimmed = readIdentity(writeTemp("shim.json", { current: "@new/name", legacy: "@old/name", shim: { enabled: true } }));
    assert.equal(shimmed.legacy, "@old/name");
    assert.equal(shimmed.shim.enabled, true);
  });

  it("fails closed on invalid identities", () => {
    const invalid: Array<[string, unknown]> = [
      ["not an object", []],
      ["missing current", { legacy: null, shim: { enabled: false } }],
      ["current not a string", { ...valid, current: 7 }],
      ["current with uppercase", { ...valid, current: "@Scope/Pkg" }],
      ["current with spaces", { ...valid, current: "my package" }],
      ["empty current", { ...valid, current: "" }],
      ["legacy equals current", { ...valid, legacy: "@scope/pkg" }],
      ["legacy invalid", { ...valid, legacy: "NOT VALID" }],
      ["legacy undefined", { current: "@scope/pkg", shim: { enabled: false } }],
      ["shim missing", { current: "@scope/pkg", legacy: null }],
      ["shim.enabled not boolean", { ...valid, shim: { enabled: "no" } }],
      ["shim enabled without legacy", { ...valid, shim: { enabled: true } }],
      ["unknown top-level key", { ...valid, extra: 1 }],
      ["unknown shim key", { ...valid, shim: { enabled: false, mode: "x" } }],
    ];
    for (const [name, data] of invalid) {
      assert.throws(() => validateIdentity(data), Error, name);
      assert.throws(() => readIdentity(writeTemp("bad.json", data as object)), Error, name);
    }
  });

  it("fails on unreadable and malformed files", () => {
    assert.throws(() => readIdentity(join(tmpdir(), "does-not-exist-identity.json")), /cannot read identity file/);
    assert.throws(() => readIdentity(writeTemp("broken.json", "{ nope")), /not valid JSON/);
  });

  it("detects a mismatch with package.json", () => {
    const other = writeTemp("package.json", { name: "@other/name" });
    assert.throws(() => assertMatchesPackageJson(identity, other), /differs from package\.json name/);
    assert.throws(() => assertMatchesPackageJson(identity, join(tmpdir(), "no-package.json")), /cannot read the package name/);
  });
});
