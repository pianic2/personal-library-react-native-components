import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Skill pack validator (PLRNUI-322 / E13-21). Usage: node scripts/ai/validate-skills.mjs [skills-dir]
// Exit 0 when every skills/<name>/SKILL.md follows the pack rules, 1 with one line per problem otherwise, 2 on usage errors.
// Rules: folder = name (lowercase-hyphen, <= 64); description <= 1024; license and metadata.version present; SKILL.md
// <= 500 lines; references one level deep (no nested folders, no symlinks); relative links resolve inside the skill.

export const MAX_NAME = 64;
export const MAX_DESCRIPTION = 1024;
export const MAX_LINES = 500;
// Maintainer workflow skills that predate the pack metadata rules (PLRNUI-322). They are checked for everything except
// license and metadata.version, which only skills published to consumers need. Do not add new names here.
export const METADATA_EXEMPT = new Set(["texo-execute", "texo-review"]);

const NAME_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Minimal frontmatter reader: `key: value` scalars plus one nested block such as `metadata:` with indented scalars. */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return null;
  const data = {};
  let block = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const nested = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (nested && block) {
      data[block][nested[1]] = unquote(nested[2]);
      continue;
    }
    const top = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!top) continue;
    if (top[2] === "") {
      block = top[1];
      data[block] = {};
    } else {
      block = null;
      data[top[1]] = unquote(top[2]);
    }
  }
  return data;
}

function unquote(value) {
  const v = value.trim();
  return (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")) ? v.slice(1, -1) : v;
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function checkLinks(file, skillDir, problems, label) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    const path = resolve(dirname(file), target.split("#")[0]);
    if (relative(skillDir, path).startsWith("..")) problems.push(`${label}: link "${target}" leaves the skill folder`);
    else if (!existsSync(path)) problems.push(`${label}: broken link "${target}"`);
    else if (relative(skillDir, path).split(sep).filter((part) => part !== "").length > 2 && relative(skillDir, path).startsWith(`references${sep}`))
      problems.push(`${label}: link "${target}" is deeper than one level under references/`);
  }
}

/** Returns the list of problems (empty when the pack is valid). */
export function validateSkills(root) {
  const problems = [];
  if (!existsSync(root)) return [`${root}: skills directory not found`];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const folder = entry.name;
    const skillDir = join(root, folder);
    const label = `${folder}/SKILL.md`;
    const skillFile = join(skillDir, "SKILL.md");
    if (!existsSync(skillFile)) {
      problems.push(`${folder}: missing SKILL.md`);
      continue;
    }
    const text = readFileSync(skillFile, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) problems.push(`${label}: missing frontmatter`);
    else {
      if (fm.name !== folder) problems.push(`${label}: name "${fm.name ?? ""}" must equal the folder name "${folder}"`);
      if (typeof fm.name === "string") {
        if (fm.name.length > MAX_NAME) problems.push(`${label}: name is ${fm.name.length} characters (max ${MAX_NAME})`);
        if (!NAME_RULE.test(fm.name)) problems.push(`${label}: name "${fm.name}" must be lowercase letters, digits and single hyphens`);
      }
      if (!fm.description) problems.push(`${label}: description is required`);
      else if (fm.description.length > MAX_DESCRIPTION)
        problems.push(`${label}: description is ${fm.description.length} characters (max ${MAX_DESCRIPTION})`);
      if (!METADATA_EXEMPT.has(folder)) {
        if (!fm.license) problems.push(`${label}: license is required`);
        if (!fm.metadata || !fm.metadata.version) problems.push(`${label}: metadata.version is required`);
      }
    }
    const lines = text.split(/\r?\n/).length;
    if (lines > MAX_LINES) problems.push(`${label}: ${lines} lines (max ${MAX_LINES})`);

    for (const path of listFiles(skillDir)) {
      const rel = relative(skillDir, path).split(sep);
      if (lstatSync(path).isSymbolicLink()) problems.push(`${folder}/${rel.join("/")}: symlinks are not allowed (copy the file)`);
      if (rel[0] === "references" && rel.length > 2) problems.push(`${folder}/${rel.join("/")}: references must be one level deep`);
    }
    checkLinks(skillFile, skillDir, problems, label);
    const references = join(skillDir, "references");
    if (existsSync(references))
      for (const file of readdirSync(references))
        if (file.endsWith(".md") && lstatSync(join(references, file)).isFile())
          checkLinks(join(references, file), skillDir, problems, `${folder}/references/${file}`);
  }
  return problems;
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args[0]?.startsWith("-")) {
    console.error("usage: validate-skills.mjs [skills-dir]");
    process.exit(2);
  }
  const root = resolve(args[0] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills"));
  const problems = validateSkills(root);
  if (problems.length) {
    for (const problem of problems) console.error(problem);
    console.error(`validate-skills: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log(`validate-skills: ok (${readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).length} skills)`);
}
