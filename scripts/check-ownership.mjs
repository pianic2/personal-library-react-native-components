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
// anything else is an fnmatch pattern where "*" also matches "/".
function matchesPattern(pattern, path) {
  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    return path === base || path.startsWith(`${base}/`);
  }
  const source = pattern.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".").replace(/\[!/g, "[^");
  return new RegExp(`^${source}$`).test(path);
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
  if (!ticketId) {
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
  if (!ticket || !Array.isArray(ticket.filesTouched) || ticket.filesTouched.length === 0) {
    console.error(`unknown ticket or no filesTouched: ${ticketId}`);
    return 2;
  }
  // Optional per-ticket allow-list of generated files; the current backlog schema has no such field.
  const patterns = [...ticket.filesTouched, ...(ticket.allowGenerated ?? []), ...ALWAYS_ALLOWED];
  let files;
  try {
    const output = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { encoding: "utf8" });
    files = output.split("\n").filter(Boolean);
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

process.exit(main());
