import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(join(repo, file), "utf8");
const scripts: Record<string, string> = JSON.parse(read("package.json")).scripts;

describe("AGENTS.md (PLRNUI-312)", () => {
  const agents = read("AGENTS.md");

  it("is at most 150 lines and 32 KiB", () => {
    assert.ok(agents.trimEnd().split("\n").length <= 150);
    assert.ok(Buffer.byteLength(agents) <= 32 * 1024);
  });

  it("only mentions npm scripts that exist in package.json", () => {
    const used = [...agents.matchAll(/npm run ([\w:.-]+)/g)].map((m) => m[1]);
    assert.ok(used.length > 0);
    for (const name of used) assert.ok(name in scripts, `npm run ${name} is not a package.json script`);
    for (const required of ["typecheck", "test", "ai:build", "api:snapshot:check"]) {
      assert.ok(agents.includes(`npm run ${required}`) || (required === "test" && agents.includes("`npm test`")), `missing ${required}`);
    }
  });

  it("references files that exist", () => {
    const paths = [...agents.matchAll(/`((?:ai|docs|audit|scripts|config|skills|tests)\/[\w./-]+?)`/g)].map((m) => m[1]);
    for (const p of paths) {
      if (/[<*]/.test(p) || p.endsWith("/")) continue;
      assert.ok(existsSync(join(repo, p)), `${p} does not exist`);
    }
  });

  it("states the core rules", () => {
    assert.match(agents, /never hand-edited/i);
    assert.match(agents, /One codebase/i);
    assert.match(agents, /Do not rename/i);
  });
});

describe("CLAUDE.md and consumer snippet (PLRNUI-312)", () => {
  it("CLAUDE.md imports AGENTS.md", () => {
    assert.match(read("CLAUDE.md"), /^@AGENTS\.md\s*$/m);
  });

  it("ai/AGENTS.consumer.md exists and names the package", () => {
    const snippet = read("ai/AGENTS.consumer.md");
    assert.ok(snippet.includes("@personal-library/react-native-components"));
    assert.ok(snippet.split("\n").length <= 40);
  });
});
