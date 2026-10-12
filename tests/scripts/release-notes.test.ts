import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Category = { title: string; labels: string[] };
type Config = { excludeLabels: string[]; categories: Category[] };

/** Reads the restricted YAML shape of .github/release.yml (changelog / exclude / categories with title and label lists). */
function parseReleaseYml(text: string): Config {
  const config: Config = { excludeLabels: [], categories: [] };
  let section: "exclude" | "categories" | null = null;
  let category: Category | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    if (/^\s*(#.*)?$/.test(line)) continue;
    if (/^\s{2}exclude:\s*$/.test(line)) { section = "exclude"; continue; }
    if (/^\s{2}categories:\s*$/.test(line)) { section = "categories"; continue; }
    const title = /^\s{4}- title:\s*(.+)$/.exec(line);
    if (title && section === "categories") { category = { title: title[1]!.trim(), labels: [] }; config.categories.push(category); continue; }
    const label = /^\s+- (.+)$/.exec(line);
    if (label) {
      const value = label[1]!.trim().replace(/^"(.*)"$/, "$1");
      if (section === "exclude") config.excludeLabels.push(value);
      else if (category) category.labels.push(value);
    }
  }
  return config;
}

/** GitHub semantics: excluded labels drop the pull request; otherwise it goes to the first category with a matching label ("*" matches all). */
function categorize(config: Config, labels: string[]): string | undefined {
  if (labels.some((l) => config.excludeLabels.includes(l))) return undefined;
  return config.categories.find((c) => c.labels.includes("*") || c.labels.some((l) => labels.includes(l)))?.title;
}

const config = parseReleaseYml(read(".github/release.yml"));

describe("PLRNUI-240 release notes", () => {
  it("defines the categories, in order, with a catch-all last", () => {
    assert.deepEqual(
      config.categories.map((c) => c.title),
      ["Breaking changes", "Migration", "Deprecations", "Features", "Fixes", "Documentation", "Other changes"]
    );
    assert.deepEqual(config.categories.at(-1)!.labels, ["*"]);
    assert.deepEqual(config.excludeLabels, ["skip-changelog"]);
    for (const category of config.categories) assert.ok(category.labels.length > 0, `${category.title} has labels`);
  });

  it("groups fixture pull requests into the categories (sample release notes)", () => {
    const fixtures: Array<[string, string[], string | undefined]> = [
      ["Remove the legacy Button prop", ["breaking", "feature"], "Breaking changes"],
      ["Codemod for the new import path", ["migration"], "Migration"],
      ["Deprecate PACKAGE_NAME", ["deprecation", "documentation"], "Deprecations"],
      ["Add DataTable model", ["feature"], "Features"],
      ["Improve Select", ["enhancement"], "Features"],
      ["Fix Modal focus restore", ["bug"], "Fixes"],
      ["Fix typo", ["fix", "documentation"], "Fixes"],
      ["Explain the release flow", ["documentation"], "Documentation"],
      ["Update a workflow", ["ci"], "Other changes"],
      ["Unlabelled change", [], "Other changes"],
      ["Bump a dev dependency", ["skip-changelog", "bug"], undefined],
    ];
    const notes = new Map<string, string[]>();
    for (const [title, labels, expected] of fixtures) {
      const category = categorize(config, labels);
      assert.equal(category, expected, title);
      if (category) notes.set(category, [...(notes.get(category) ?? []), title]);
    }
    for (const title of config.categories.map((c) => c.title)) assert.ok(notes.has(title), `the sample notes include "${title}"`);
  });

  it("the template has the Migration, Deprecations and Compatibility sections and a link to the compatibility table", () => {
    const template = read("docs/policies/release-notes-template.md");
    for (const heading of ["## Highlights", "## Breaking changes", "## Migration", "## Deprecations", "## Compatibility", "## What's changed"]) {
      assert.ok(template.includes(heading), heading);
    }
    const link = /\[Consumer Compatibility\]\((\.\.\/compatibility\.md)\)/.exec(template);
    assert.ok(link, "compatibility table link");
    assert.ok(existsSync(resolve(root, "docs", "policies", link![1]!)), "the link target exists");
    assert.ok(existsSync(join(root, "docs", "policies", "deprecation.md")));
    for (const category of config.categories) assert.ok(template.includes(category.title), `the template lists "${category.title}"`);
  });

  it("SECURITY.md links the release notes template and the compatibility page", () => {
    const security = read("SECURITY.md");
    assert.match(security, /\]\(docs\/policies\/release-notes-template\.md\)/);
    assert.match(security, /\]\(docs\/compatibility\.md\)/);
    assert.ok(existsSync(join(root, "docs/policies/release-notes-template.md")));
  });

  it("uses @changesets/changelog-github with the repository, and installs it", () => {
    const changesets = JSON.parse(read(".changeset/config.json"));
    assert.equal(changesets.changelog[0], "@changesets/changelog-github");
    assert.match(changesets.changelog[1].repo, /^[\w.-]+\/[\w.-]+$/);
    const pkg = JSON.parse(read("package.json"));
    assert.ok(pkg.devDependencies["@changesets/changelog-github"]);
    assert.ok(JSON.parse(read("package-lock.json")).packages["node_modules/@changesets/changelog-github"], "the lockfile pins it");
  });

  it("the parser reads categories only from the changelog section", () => {
    const sample = parseReleaseYml("changelog:\n  exclude:\n    labels:\n      - x\n  categories:\n    - title: A\n      labels:\n        - a\n    - title: B\n      labels:\n        - \"*\"\n");
    assert.deepEqual(sample, { excludeLabels: ["x"], categories: [{ title: "A", labels: ["a"] }, { title: "B", labels: ["*"] }] });
    assert.equal(categorize(sample, ["zzz"]), "B");
    assert.equal(categorize(sample, ["x", "a"]), undefined);
  });
});
