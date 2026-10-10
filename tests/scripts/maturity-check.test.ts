import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "maturity-check.mjs");

function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
}

type Meta = { status: string; parents?: string[] };

/** A complete passing fixture repo with one component per entry in `components`. Returns the root and a writer. */
function fixture(components: Record<string, Meta>) {
  const dir = mkdtempSync(join(tmpdir(), "plrnui-174-"));
  const write = (rel: string, text: string) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  const kebab = (n: string) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  let index = "";
  let nav = "nav:\n";
  let catalog = "# Components\n";
  for (const [name, meta] of Object.entries(components)) {
    const full = {
      name, category: "layout", status: meta.status, summary: "A fixture component.", whenToUse: ["Testing"], whenNotToUse: [],
      composition: { parents: meta.parents ?? [], children: [], pairsWith: [] }, a11y: [], variants: {}, states: ["default"], platformNotes: [],
      examples: [{ title: name, code: `<${name} />` }],
    };
    write(`src/components/${name}/${name}.meta.ts`, `export const meta = ${JSON.stringify(full)};\n`);
    write(`src/components/${name}/index.ts`, `export const ${name} = 1;\nexport type ${name}Props = object;\n`);
    index += `export { ${name} } from "./components/${name}/index.js";\nexport type { ${name}Props } from "./components/${name}/index.js";\n`;
    write(`docs/components/layout/${kebab(name)}.md`, `# ${name}\n`);
    nav += `  - ${name}: components/layout/${kebab(name)}.md\n`;
    catalog += `- [${name}](components/layout/${kebab(name)}.md)\n`;
    write(`examples/${name}.tsx`, `export const e = <${name} />;\n`);
    write(`tests/${name}.test.tsx`, `import { ${name} } from "../src";\n`);
  }
  write("src/index.ts", index);
  write("mkdocs.yml", nav);
  write("docs/components.md", catalog);
  return { dir, write, done: () => rmSync(dir, { recursive: true, force: true }) };
}

function check(components: Record<string, Meta>, mutate?: (f: ReturnType<typeof fixture>) => void, ...flags: string[]) {
  const f = fixture(components);
  try {
    mutate?.(f);
    return spawnSync(process.execPath, [cli, "--root", f.dir, ...flags], { encoding: "utf8" });
  } finally {
    f.done();
  }
}

describe("PLRNUI-174 maturity check", () => {
  it("passes on the repository with its current component statuses", () => {
    const result = run([]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /36 components; 0 enforced failure/);
    const json = JSON.parse(run(["--json"]).stdout) as { ok: boolean; components: Array<{ name: string; status: string }> };
    assert.equal(json.ok, true);
    assert.equal(json.components.filter((c) => c.status === "demo").length, 18);
  });

  it("passes a complete fixture", () => {
    assert.equal(check({ Foo: { status: "demo" } }).status, 0);
  });

  it("fails a demo component whose example reference is removed, and names the check", () => {
    const result = check({ Foo: { status: "demo" } }, (f) => f.write("examples/Foo.tsx", "export const e = 1;\n"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL Foo \(demo\): example/);
  });

  it("fails demo components for each missing piece of evidence", () => {
    const cases: Array<[string, (f: ReturnType<typeof fixture>) => void, RegExp]> = [
      ["docs page", (f) => rmSync(join(f.dir, "docs/components/layout/foo.md")), /docsPage/],
      ["nav", (f) => f.write("mkdocs.yml", "nav:\n"), /nav/],
      ["catalog", (f) => f.write("docs/components.md", "# Components\n"), /catalog/],
      ["test", (f) => rmSync(join(f.dir, "tests/Foo.test.tsx")), /test/],
      ["props type", (f) => f.write("src/index.ts", 'export { Foo } from "./components/Foo/index.js";\n'), /propsType/],
      ["root export", (f) => f.write("src/index.ts", ""), /exported/],
    ];
    for (const [label, mutate, pattern] of cases) {
      const result = check({ Foo: { status: "demo" } }, mutate);
      assert.equal(result.status, 1, label);
      assert.match(result.stderr, pattern, label);
    }
  });

  it("does not fail a prototype component with open checks, but reports it", () => {
    const result = check({ Foo: { status: "prototype" } }, (f) => f.write("examples/Foo.tsx", "export const e = 1;\n"));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1 not-yet-promoted/);
    assert.match(result.stdout, /Foo\s+prototype\s+ok\s+ok\s+ok\s+ok\s+ok\s+FAIL/);
  });

  it("accepts an example that shows the component through a composition parent", () => {
    const result = check({ Parent: { status: "demo" }, Child: { status: "demo", parents: ["Parent"] } }, (f) => f.write("examples/Child.tsx", "export const e = 1;\n"));
    assert.equal(result.status, 0, result.stderr);
  });

  it("fails when a directory under src/components has no <Name>.meta.ts", () => {
    const result = check({ Foo: { status: "demo" } }, (f) => f.write("src/components/Orphan/index.ts", "export const Orphan = 1;\n"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Orphan.*missing meta file/);
  });

  it("fails on a meta lint problem", () => {
    const result = check({ Foo: { status: "demo" } }, (f) => f.write("src/components/Foo/Foo.meta.ts", 'export const meta = { name: "Foo" };\n'));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /META /);
  });

  it("exits 2 on usage errors and unreadable input", () => {
    assert.equal(run(["--nope"]).status, 2);
    assert.equal(run(["--root"]).status, 2);
    assert.equal(run(["--root", join(tmpdir(), "plrnui-174-does-not-exist")]).status, 2);
  });

  it("reads component status only through scripts/lib/meta.mjs", () => {
    const source = readFileSync(cli, "utf8");
    assert.match(source, /from '\.\/lib\/meta\.mjs'/);
    assert.doesNotMatch(source, /\.meta\.ts/);
    assert.doesNotMatch(source, /transpileModule|runInContext|new Function/);
  });
});
