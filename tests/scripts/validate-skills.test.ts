import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
// @ts-expect-error plain ESM script without type declarations
import { METADATA_EXEMPT, parseFrontmatter, validateSkills } from "../../scripts/ai/validate-skills.mjs";

const script = resolve(import.meta.dirname, "../../scripts/ai/validate-skills.mjs");

function pack(files: Record<string, string>): { root: string; cleanup(): void } {
  const root = mkdtempSync(join(tmpdir(), "validate-skills-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const skill = (name: string, extra = "", body = "Body.\n") =>
  `---\nname: ${name}\ndescription: Does a thing. Use when asked.\nlicense: MIT\nmetadata:\n  version: "1.0.0"\n${extra}---\n\n${body}`;

describe("PLRNUI-322 validate-skills", () => {
  it("accepts a valid pack", () => {
    const p = pack({ "a-skill/SKILL.md": skill("a-skill", "", "See [guide](references/guide.md).\n"), "a-skill/references/guide.md": "# Guide\n" });
    try {
      assert.deepEqual(validateSkills(p.root), []);
    } finally {
      p.cleanup();
    }
  });

  it("the CLI exits 0 on the repository skills and 1 on a fixture with a 70-char name", () => {
    const repo = spawnSync(process.execPath, [script], { encoding: "utf8" });
    assert.equal(repo.status, 0, repo.stderr);

    const long = "a".repeat(70);
    const p = pack({ [`${long}/SKILL.md`]: skill(long) });
    try {
      const result = spawnSync(process.execPath, [script, p.root], { encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /70 characters \(max 64\)/);
    } finally {
      p.cleanup();
    }
  });

  it("rejects name/folder mismatch, bad characters, long description and missing fields", () => {
    const p = pack({
      "one/SKILL.md": skill("two"),
      "Bad_Name/SKILL.md": skill("Bad_Name"),
      "long-desc/SKILL.md": `---\nname: long-desc\ndescription: ${"d".repeat(1025)}\nlicense: MIT\nmetadata:\n  version: 1\n---\n`,
      "no-meta/SKILL.md": "---\nname: no-meta\ndescription: x\n---\n",
      "no-front/SKILL.md": "# nothing\n",
      "empty-dir/readme.txt": "x",
    });
    try {
      const problems: string[] = validateSkills(p.root);
      const has = (re: RegExp) => assert.ok(problems.some((line) => re.test(line)), `${re} not in\n${problems.join("\n")}`);
      has(/one\/SKILL.md: name "two" must equal the folder name "one"/);
      has(/Bad_Name\/SKILL.md: name "Bad_Name" must be lowercase/);
      has(/long-desc\/SKILL.md: description is 1025 characters/);
      has(/no-meta\/SKILL.md: license is required/);
      has(/no-meta\/SKILL.md: metadata.version is required/);
      has(/no-front\/SKILL.md: missing frontmatter/);
      has(/empty-dir: missing SKILL.md/);
    } finally {
      p.cleanup();
    }
  });

  it("counts lines like wc -l: exactly 500 passes, 501 fails", () => {
    const fixture = (total: number) => {
      const header = skill("big", "", "").split("\n"); // ends with "" after the final newline
      header.pop();
      const filler = Array.from({ length: total - header.length }, () => "x");
      return [...header, ...filler].join("\n") + "\n";
    };
    const exact = pack({ "big/SKILL.md": fixture(500) });
    const over = pack({ "big/SKILL.md": fixture(501) });
    try {
      assert.equal(readFileSync(join(exact.root, "big/SKILL.md"), "utf8").split("\n").length - 1, 500);
      assert.equal(validateSkills(exact.root).filter((l: string) => /lines/.test(l)).length, 0);
      assert.match(validateSkills(over.root).join("\n"), /big\/SKILL.md: 501 lines \(max 500\)/);
    } finally {
      exact.cleanup();
      over.cleanup();
    }
  });

  it("enforces description and license on folded, literal, continuation and empty values", () => {
    const long = "d".repeat(1100);
    const p = pack({
      "folded/SKILL.md": `---\r\nname: folded\r\ndescription: >\r\n  ${long}\r\nlicense: MIT\r\nmetadata:\r\n  version: 1\r\n---\r\n`,
      "literal/SKILL.md": `---\nname: literal\ndescription: |\n  ${long}\nlicense: MIT\nmetadata:\n  version: 1\n---\n`,
      "plain/SKILL.md": `---\nname: plain\ndescription:\n  ${long}\nlicense: MIT\nmetadata:\n  version: 1\n---\n`,
      "empty/SKILL.md": `---\nname: empty\ndescription: fine\nlicense:\nmetadata:\n  version: 1\n---\n`,
      "ok-folded/SKILL.md": `---\nname: ok-folded\ndescription: >\n  one\n  two\nlicense: MIT # comment\nmetadata:\n  version: 1\n---\n`,
      "bom/SKILL.md": `\uFEFF${skill("bom")}`,
    });
    try {
      const text = validateSkills(p.root).join("\n");
      assert.match(text, /folded\/SKILL.md: description is 1100 characters/);
      assert.match(text, /literal\/SKILL.md: description is 1100 characters/);
      assert.match(text, /plain\/SKILL.md: description is 1100 characters/);
      assert.match(text, /empty\/SKILL.md: license is required/);
      assert.doesNotMatch(text, /ok-folded|bom\//);
      assert.equal(parseFrontmatter("---\nname: x\ndescription: >\n  one\n  two\n---\n").description, "one two");
      assert.equal(parseFrontmatter("---\nlicense: MIT # c\n---\n").license, "MIT");
    } finally {
      p.cleanup();
    }
  });

  it("rejects broken links, links leaving the skill, nested references and symlinks", () => {
    const p = pack({
      "links/SKILL.md": skill("links", "", "[a](references/missing.md) [b](../other/SKILL.md) [c](https://example.com) [d](#top) [e](references/deep/x.md)\n"),
      "links/references/deep/x.md": "x\n",
      "other/SKILL.md": skill("other"),
    });
    symlinkSync(join(p.root, "other/SKILL.md"), join(p.root, "links/references/alias.md"));
    try {
      const problems: string[] = validateSkills(p.root);
      const text = problems.join("\n");
      assert.match(text, /broken link "references\/missing.md"/);
      assert.match(text, /link "\.\.\/other\/SKILL.md" leaves the skill folder/);
      assert.match(text, /references must be one level deep/);
      assert.match(text, /symlinks are not allowed/);
      assert.doesNotMatch(text, /example\.com|#top/);
    } finally {
      p.cleanup();
    }
  });

  it("checks reference-style, angle-bracket, single-quoted-title and percent-encoded links", () => {
    const body = "[a][r]\n\n[r]: gone-ref.md\n\n[b](<gone angle.md>) [c](gone-title.md 'Title') [d](with%20space.md) [e](paren(1).md)\n";
    const p = pack({ "refs/SKILL.md": skill("refs", "", body), "refs/with space.md": "x\n", "refs/paren(1).md": "x\n" });
    try {
      const text = validateSkills(p.root).join("\n");
      assert.match(text, /broken link "gone-ref.md"/);
      assert.match(text, /broken link "gone angle.md"/);
      assert.match(text, /broken link "gone-title.md"/);
      assert.doesNotMatch(text, /with%20space|paren/);
    } finally {
      p.cleanup();
    }
  });

  it("flags a symlinked skill folder", () => {
    const p = pack({ "real/SKILL.md": skill("real") });
    symlinkSync(join(p.root, "real"), join(p.root, "alias"));
    try {
      assert.match(validateSkills(p.root).join("\n"), /alias: symlinks are not allowed/);
    } finally {
      p.cleanup();
    }
  });

  it("ignores links inside fenced (``` and ~~~) blocks and inline code", () => {
    const p = pack({ "code/SKILL.md": skill("code", "", "```md\n[x](nowhere.md)\n```\n\n~~~\n[y](nowhere2.md)\n~~~\n\nUse `[q](zz.md)` inline.\n") });
    try {
      assert.deepEqual(validateSkills(p.root), []);
    } finally {
      p.cleanup();
    }
  });

  it("exempts only the maintainer skills from license and metadata.version", () => {
    assert.deepEqual([...METADATA_EXEMPT].sort(), ["texo-execute", "texo-review"]);
    const p = pack({ "texo-execute/SKILL.md": "---\nname: texo-execute\ndescription: x\n---\n", "texo-new/SKILL.md": "---\nname: texo-new\ndescription: x\n---\n" });
    try {
      const problems: string[] = validateSkills(p.root);
      assert.ok(!problems.some((l) => l.startsWith("texo-execute")));
      assert.ok(problems.some((l) => l.startsWith("texo-new/SKILL.md: license is required")));
    } finally {
      p.cleanup();
    }
  });

  it("parses quoted values and nested blocks, and reports a missing directory", () => {
    assert.deepEqual(parseFrontmatter(`---\nname: "x"\nmetadata:\n  version: '2.0'\n---\nbody`), { name: "x", metadata: { version: "2.0" } });
    assert.equal(parseFrontmatter("no frontmatter"), null);
    assert.match(validateSkills(join(tmpdir(), "does-not-exist-skills"))[0], /not found/);
    const usage = spawnSync(process.execPath, [script, "--bad"], { encoding: "utf8" });
    assert.equal(usage.status, 2);
  });
});
