import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const scripts = new Set(Object.keys(pkg.scripts));
// npm built-ins that are valid without a package.json script.
const BUILTINS = new Set(["ci", "install"]);

/** Commands written as "npm run <script>" or "npm <builtin>" inside fenced code blocks or inline code. */
export function listedNpmCommands(markdown: string): string[] {
  const found: string[] = [];
  const spans = [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const inline = [...markdown.replace(/```[\s\S]*?```/g, "").matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  for (const chunk of [...spans, ...inline]) {
    for (const match of chunk.matchAll(/(?:^|[\s;&|$])npm\s+(run\s+)?([A-Za-z0-9:_-]+)/gm)) {
      found.push(match[1] ? `run:${match[2]}` : `builtin:${match[2]}`);
    }
  }
  return found;
}

export function unknownCommands(markdown: string): string[] {
  return listedNpmCommands(markdown).filter((entry) => {
    const sep = entry.indexOf(":");
    const kind = entry.slice(0, sep);
    const name = entry.slice(sep + 1);
    if (kind === "run") return !scripts.has(name);
    return !BUILTINS.has(name) && !scripts.has(name);
  });
}

describe("PLRNUI-125 CONTRIBUTING commands", () => {
  const contributing = readFileSync(resolve(root, "CONTRIBUTING.md"), "utf8");

  it("lists at least the core commands", () => {
    const listed = listedNpmCommands(contributing);
    for (const expected of ["builtin:ci", "run:typecheck", "builtin:test", "run:build", "run:release:check"]) {
      assert.ok(listed.includes(expected), `missing ${expected}`);
    }
  });

  it("every listed npm command exists in package.json scripts or is an npm built-in", () => {
    assert.deepEqual(unknownCommands(contributing), []);
  });

  it("detects a command that does not exist", () => {
    assert.deepEqual(unknownCommands("```sh\nnpm run definitely-not-a-script\n```"), ["run:definitely-not-a-script"]);
    assert.deepEqual(unknownCommands("Use `npm run nope` now."), ["run:nope"]);
    assert.deepEqual(unknownCommands("```sh\nnpm run typecheck && npm run missing-one\n```"), ["run:missing-one"]);
  });

  it("states the Node version required by package.json engines", () => {
    const required = String(pkg.engines.node).replace(/^>=/, "");
    assert.ok(contributing.includes(`>=${required}`), `CONTRIBUTING must mention Node >=${required}`);
  });

  it("lists the demo minimum of the maturity ladder", () => {
    for (const item of ["real rendering", "typed API", "main states and variants", "theme support", "an example", "catalog", "minimal verification"]) {
      assert.ok(contributing.includes(item), `missing demo minimum item: ${item}`);
    }
  });

  it("does not require an internal Jira key for external pull requests", () => {
    const external = contributing.split("## Maintainers")[0].replace(/\s+/g, " ");
    assert.equal(/PLRNUI-/.test(external), false, "PLRNUI keys belong only in the Maintainers section");
    assert.ok(external.includes("An internal ticket key is not required"));
  });
});
