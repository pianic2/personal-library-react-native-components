import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
// @ts-expect-error plain ESM script without type declarations
import { buildManifest, serialize, validateManifest } from "../../scripts/ai/build-props.mjs";
// @ts-expect-error plain ESM script without type declarations
import { extractProps } from "../../scripts/ai/lib/extract-props.mjs";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/ai/build-props.mjs");
const schema = JSON.parse(readFileSync(join(root, "ai/schema/props.schema.json"), "utf8"));
const manifestText = readFileSync(join(root, "ai/manifests/props.json"), "utf8");
const manifest = JSON.parse(manifestText);
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function run(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

describe("PLRNUI-134 props manifest", () => {
  it("validates against ai/schema/props.schema.json with ajv", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validate = ajv.compile(schema);
    assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  });

  it("version and package equal package.json", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    assert.equal(manifest.version, pkg.version);
    assert.equal(manifest.package, pkg.name);
    assert.equal(manifest.schemaVersion, 1);
  });

  it("contains every component value export of src/index.ts", () => {
    const { components } = extractProps({ root });
    assert.ok(Object.keys(components).length > 30);
    assert.deepEqual(Object.keys(manifest.components), Object.keys(components).sort());
    const indexSource = readFileSync(join(root, "src/index.ts"), "utf8");
    for (const name of ["Button", "Modal", "Stack", "ThemeProvider", "NavProvider"]) {
      assert.ok(name in manifest.components, `${name} missing`);
      assert.match(indexSource, new RegExp(`\\b${name}\\b`));
    }
  });

  it("describes props with name, type, required and default", () => {
    const button = Object.fromEntries(manifest.components.Button.props.map((p: { name: string }) => [p.name, p]));
    assert.equal(button.variant.default, "primary");
    assert.equal(button.variant.required, false);
    assert.deepEqual(button.variant.values, ["primary", "secondary", "ghost", "danger", "info"]);
    assert.equal(button.disabled.default, false);
    const modal = Object.fromEntries(manifest.components.Modal.props.map((p: { name: string }) => [p.name, p]));
    assert.equal(modal.visible.required, true);
    assert.equal(modal.visible.default, null);
  });

  it("is deterministic: sorted, no absolute paths, and the committed file equals a fresh build", () => {
    assert.equal(serialize(buildManifest(root)), manifestText);
    assert.equal(serialize(buildManifest(root)), serialize(buildManifest(root)));
    for (const [name, entry] of Object.entries(manifest.components) as Array<[string, { props: Array<{ name: string }> }]>) {
      const names = entry.props.map((p) => p.name);
      assert.deepEqual(names, [...names].sort(), `${name} props are not sorted`);
    }
    assert.deepEqual(Object.keys(manifest.components), Object.keys(manifest.components).slice().sort());
    assert.doesNotMatch(manifestText, /\/(tmp|home|Users|root)\//);
  });

  it("--check passes on the repository", () => {
    const result = run(["--check"]);
    assert.equal(result.status, 0, result.stderr);
  });

  it("the schema rejects invalid manifests (fail-closed)", () => {
    const clone = () => structuredClone(manifest);
    const wrongVersion = clone();
    delete wrongVersion.version;
    assert.ok(validateManifest(wrongVersion, schema).length > 0);
    const badProp = clone();
    badProp.components.Button.props[0].required = "yes";
    assert.ok(validateManifest(badProp, schema).length > 0);
    const extra = clone();
    extra.components.Button.props[0].surprise = true;
    assert.ok(validateManifest(extra, schema).length > 0);
    const empty = clone();
    empty.components = {};
    assert.ok(validateManifest(empty, schema).length > 0);
  });

  it("fails with exit 1 when the committed manifest is stale", () => {
    const dir = mkdtempSync(join(tmpdir(), "props-manifest-"));
    dirs.push(dir);
    const stale = join(dir, "props.json");
    writeFileSync(stale, manifestText.replace('"version"', '"versionX"'));
    const result = run(["--check", "--out", stale]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /out of date/);
  });

  it("fails closed (exit 2, nothing written) on invalid metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "props-manifest-"));
    dirs.push(dir);
    cpSync(join(root, "src"), join(dir, "src"), { recursive: true });
    for (const file of ["package.json", "tsconfig.json"]) cpSync(join(root, file), join(dir, file));
    cpSync(join(root, "ai/schema"), join(dir, "ai/schema"), { recursive: true });
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
    rmSync(join(dir, "src/components/Button/Button.meta.ts"));
    const result = run(["--root", dir]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /metadata is invalid/);
    assert.equal(spawnSync("test", ["-e", join(dir, "ai/manifests/props.json")]).status, 1);
  });
});
