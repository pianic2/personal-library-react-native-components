import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "check-component-docs.mjs");

const completePage = (label: string) =>
  `# Foo\n\n**Stability:** ${label} — text.\n\n## Import\n\n\`\`\`ts\nimport { Foo } from "pkg";\n\`\`\`\n\n## Props\n\nNone.\n\n## Usage\n\n\`\`\`tsx\n<Foo />\n\`\`\`\n`;

function fixture(status: string, page: string | null) {
  const dir = mkdtempSync(join(tmpdir(), "plrnui-199-"));
  const meta = {
    name: "Foo", category: "layout", status, summary: "A fixture.", whenToUse: ["x"], whenNotToUse: [], composition: { parents: [], children: [], pairsWith: [] },
    a11y: [], variants: {}, states: ["default"], platformNotes: [], examples: [{ title: "Foo", code: "<Foo />" }],
  };
  mkdirSync(join(dir, "src/components/Foo"), { recursive: true });
  writeFileSync(join(dir, "src/components/Foo/Foo.meta.ts"), `export const meta = ${JSON.stringify(meta)};\n`);
  if (page !== null) {
    mkdirSync(dirname(join(dir, "docs/components/layout/foo.md")), { recursive: true });
    writeFileSync(join(dir, "docs/components/layout/foo.md"), page);
  }
  return dir;
}

function run(status: string, page: string | null, ...flags: string[]) {
  const dir = fixture(status, page);
  try {
    return spawnSync(process.execPath, [cli, "--root", dir, ...flags], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("PLRNUI-199 component docs lint", () => {
  it("accepts a complete page in both modes", () => {
    for (const flags of [[], ["--strict"]]) {
      const result = run("demo", completePage("beta"), ...flags);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout, /1 component pages; 0 with problems/);
    }
  });

  it("lists the missing sections per page; report-only exits 0, --strict exits 1", () => {
    const page = "# Foo\n\n**Stability:** beta\n\n## Import\n\n## Props\n";
    const report = run("demo", page);
    assert.equal(report.status, 0);
    assert.match(report.stdout, /docs\/components\/layout\/foo\.md\n  - missing "## Usage"/);
    assert.match(report.stdout, /report-only/);
    const strict = run("demo", page, "--strict");
    assert.equal(strict.status, 1);
    assert.match(strict.stdout, /missing "## Usage"/);
  });

  it("flags each missing piece: Import, Props, Usage without a tsx fence, Stability label", () => {
    const cases: Array<[string, RegExp]> = [
      ["# Foo\n\n**Stability:** beta\n\n## Props\n\n## Usage\n\n```tsx\nx\n```\n", /missing "## Import"/],
      ["# Foo\n\n**Stability:** beta\n\n## Import\n\n## Usage\n\n```tsx\nx\n```\n", /missing "## Props"/],
      ["# Foo\n\n**Stability:** beta\n\n## Import\n\n## Props\n\n## Usage\n\n```ts\nx\n```\n", /no ```tsx fence/],
      ["# Foo\n\n## Import\n\n## Props\n\n## Usage\n\n```tsx\nx\n```\n", /missing "\*\*Stability:\*\*" label/],
      ["# Foo\n\n**Stability:** beta\n\n## Import\n\n## Props\n\n## Other\n\n```tsx\nx\n```\n\n## Usage\n\ntext only\n", /no ```tsx fence/],
    ];
    for (const [page, pattern] of cases) {
      const result = run("demo", page, "--strict");
      assert.equal(result.status, 1, page);
      assert.match(result.stdout, pattern, page);
    }
  });

  it("checks the Stability label against the meta status (ADR 0011 mapping)", () => {
    assert.equal(run("prototype", completePage("experimental"), "--strict").status, 0);
    assert.equal(run("prototype", completePage("internal"), "--strict").status, 0);
    assert.equal(run("demo", completePage("experimental"), "--strict").status, 0);
    assert.equal(run("stable", completePage("stable"), "--strict").status, 0);
    const wrong = run("prototype", completePage("beta"), "--strict");
    assert.equal(wrong.status, 1);
    assert.match(wrong.stdout, /label "beta" does not fit status "prototype"/);
    assert.equal(run("stable", completePage("beta"), "--strict").status, 1);
  });

  it("flags a component without a page, and --json reports the rows", () => {
    const missing = run("demo", null, "--strict");
    assert.equal(missing.status, 1);
    assert.match(missing.stdout, /page does not exist/);
    const json = JSON.parse(run("demo", completePage("beta"), "--json").stdout) as { pages: number; failing: number; rows: Array<{ name: string; problems: string[] }> };
    assert.equal(json.pages, 1);
    assert.equal(json.failing, 0);
  });

  it("runs on the repository in report-only mode and lists a page per problem", () => {
    const result = spawnSync(process.execPath, [cli], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /36 component pages; \d+ with problems \(report-only/);
  });

  it("exits 2 on usage errors, unreadable roots and a flag used as the root", () => {
    for (const args of [["--nope"], ["--root"], ["--root", "--strict"], ["--root", join(tmpdir(), "plrnui-199-missing")]]) {
      assert.equal(spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" }).status, 2, args.join(" "));
    }
  });
});
