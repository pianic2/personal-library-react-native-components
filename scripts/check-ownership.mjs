import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// File-ownership guard (ADR 0020, PLRNUI-449): a branch diff may touch only the ticket's filesTouched.
// Usage: check-ownership.mjs <ticket-id> [base] [--backlog-dir <dir>] [--jira-map <file>]
// <ticket-id> is a local id (E18-06) or a Jira key (PLRNUI-449). Exit 0 ok, 1 violations, 2 usage/unknown ticket/git error.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Always allowed: the Execution log row of the ticket (ADR 0020, Branching).
const ALWAYS_ALLOWED = ["audit/texo-v1/STATE.md"];

// Same semantics as pmatch() in audit/texo-v1/scripts/reconcile.py: "dir/**" is a prefix match,
// anything else is a case-sensitive fnmatch pattern where "*" also matches "/".
// translate() follows Python's fnmatch.translate for [...] classes (an unterminated "[" is a literal).
function translate(pattern) {
  let out = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === "*") out += ".*";
    else if (c === "?") out += ".";
    else if (c === "[") {
      let j = i + 1;
      if (pattern[j] === "!") j += 1;
      if (pattern[j] === "]") j += 1;
      while (j < pattern.length && pattern[j] !== "]") j += 1;
      if (j >= pattern.length) out += "\\[";
      else {
        let stuff = pattern.slice(i + 1, j).replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
        if (stuff[0] === "!") stuff = `^${stuff.slice(1)}`;
        else if (stuff[0] === "^") stuff = `\\${stuff}`;
        out += `[${stuff}]`;
        i = j;
      }
    } else out += c.replace(/[.+^${}()|\\\]\/]/g, "\\$&");
  }
  return new RegExp(`^${out}$`, "s");
}

function matchesPattern(pattern, path) {
  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    return path === base || path.startsWith(`${base}/`);
  }
  return translate(pattern).test(path);
}

function findViolations(files, patterns) {
  return files.filter((file) => !patterns.some((pattern) => matchesPattern(pattern, file)));
}

function loadTicket(ticketId, backlogDir, jiraMapFile) {
  const jiraMap = JSON.parse(readFileSync(jiraMapFile, "utf8")).tickets ?? {};
  const localId = Object.entries(jiraMap).find(([, key]) => key === ticketId)?.[0] ?? ticketId;
  for (const name of readdirSync(backlogDir)) {
    if (!/^E\d+\.json$/.test(name)) continue;
    const parsed = JSON.parse(readFileSync(join(backlogDir, name), "utf8"));
    const ticket = (Array.isArray(parsed) ? parsed : parsed.tickets ?? []).find((t) => t.id === localId);
    if (ticket) return ticket;
  }
  return undefined;
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--backlog-dir" || argv[i] === "--jira-map") options[argv[i]] = argv[++i];
    else positional.push(argv[i]);
  }
  return { positional, options };
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [ticketId, base = "origin/texo/v1"] = positional;
  if (!ticketId || base.startsWith("-")) {
    console.error("usage: check-ownership.mjs <ticket-id> [base] [--backlog-dir <dir>] [--jira-map <file>]");
    return 2;
  }
  const backlogDir = options["--backlog-dir"] ?? join(REPO_ROOT, "audit", "texo-v1", "backlog");
  const jiraMapFile = options["--jira-map"] ?? join(REPO_ROOT, "audit", "texo-v1", "jira-map.json");
  let ticket;
  try {
    ticket = loadTicket(ticketId, backlogDir, jiraMapFile);
  } catch (error) {
    console.error(`cannot read backlog: ${error.message}`);
    return 2;
  }
  const isStrings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
  if (!ticket || !isStrings(ticket.filesTouched) || ticket.filesTouched.length === 0) {
    console.error(`unknown ticket or invalid filesTouched: ${ticketId}`);
    return 2;
  }
  if (ticket.allowGenerated !== undefined && !isStrings(ticket.allowGenerated)) {
    console.error(`invalid allowGenerated for ${ticketId}: expected an array of strings`);
    return 2;
  }
  // Optional per-ticket allow-list of generated files; the current backlog schema has no such field.
  const patterns = [...ticket.filesTouched, ...(ticket.allowGenerated ?? []), ...ALWAYS_ALLOWED];
  let files;
  try {
    const output = execFileSync("git", ["diff", "-z", "--name-only", "--no-renames", `${base}...HEAD`, "--"], { encoding: "utf8" });
    files = output.split("\0").filter(Boolean);
  } catch (error) {
    console.error(`git diff against ${base} failed: ${error.message}`);
    return 2;
  }
  const violations = findViolations(files, patterns);
  if (violations.length > 0) {
    console.error(`files outside the ownership of ${ticketId}:\n- ${violations.join("\n- ")}`);
    return 1;
  }
  console.log(`ownership ok for ${ticketId} (${files.length} changed files)`);
  return 0;
}

let code;
try {
  code = main();
} catch (error) {
  // An unexpected crash must not look like "violations found" (exit 1).
  console.error(`check-ownership failed: ${error.message}`);
  code = 2;
}
process.exit(code);
