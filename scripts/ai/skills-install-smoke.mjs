import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Install smoke (PLRNUI-322 / E13-21): installs the repo skill pack into a throwaway project with the pinned `skills`
// CLI and checks that every skill lands in .claude/skills (Claude Code) and .agents/skills (Codex, Cursor) as a real
// copy. Needs network access to the npm registry. Usage: node scripts/ai/skills-install-smoke.mjs [skills-dir]
// Exit 0 ok, 1 smoke failure.

export const SKILLS_CLI_VERSION = "1.7.2";

const here = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(process.argv[2] ?? join(here, "..", "..", "skills"));

function run(args, cwd) {
  const result = spawnSync("npx", ["--yes", `skills@${SKILLS_CLI_VERSION}`, ...args], { cwd, encoding: "utf8", timeout: 240000 });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function fail(message) {
  console.error(`skills-install-smoke: ${message}`);
  process.exitCode = 1;
}

if (!existsSync(skillsDir)) {
  fail(`${skillsDir} not found`);
} else {
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, "SKILL.md")))
    .map((e) => e.name);
  if (names.length === 0) fail("no skills found");
  const work = mkdtempSync(join(tmpdir(), "texo-skills-smoke-"));
  try {
    // The CLI reads a source tree; mirror the pack under skills/ so the layout matches a real checkout.
    const source = join(work, "source");
    cpSync(skillsDir, join(source, "skills"), { recursive: true });
    const listed = run(["add", source, "--list"], work);
    if (listed.status !== 0) fail(`"skills add --list" exited ${listed.status}\n${listed.output}`);
    for (const name of names) if (!listed.output.includes(name)) fail(`"skills add --list" does not list ${name}`);

    const project = join(work, "project");
    mkdirSync(project);
    writeFileSync(join(project, "package.json"), "{}\n");
    const installed = run(["add", source, "-a", "claude-code", "-a", "codex", "--copy", "-y"], project);
    if (installed.status !== 0) fail(`"skills add" exited ${installed.status}\n${installed.output}`);
    for (const target of [".claude/skills", ".agents/skills"])
      for (const name of names) {
        const file = join(project, target, name, "SKILL.md");
        if (!existsSync(file)) fail(`${target}/${name}/SKILL.md was not installed`);
        else if (lstatSync(join(project, target, name)).isSymbolicLink()) fail(`${target}/${name} is a symlink, expected a copy`);
      }
    if (!process.exitCode) console.log(`skills-install-smoke: ok (${names.length} skills into .claude/skills and .agents/skills, skills@${SKILLS_CLI_VERSION})`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
