import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Renders a minimal execution prompt for one ticket (ADR 0020, PLRNUI-448).
// Usage: ticket-prompt.mjs <PLRNUI-n|E18-05> [--backlog-dir d] [--jira-map f] [--references-dir d]
//        ticket-prompt.mjs --all [same options]   (renders every ticket of _index.json and reports the budget)
// Exit 0 ok, 1 budget not met in --all mode, 2 usage / unknown ticket / unreadable input.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUDGET_TOKENS = 2000;
const REQUIRED_SHARE = 0.95;
const STOP_RULE = "at most 3 attempts on the validation commands, then stop and report the cause; never skip or disable a test";
const ADR_PATTERN = /\bADR[ -](?:R\d+|\d{4})\b/g;

const estimateTokens = (text) => Math.ceil(text.length / 4);
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (["--backlog-dir", "--jira-map", "--references-dir"].includes(argv[i])) options[argv[i]] = argv[++i];
    else if (argv[i] === "--all") options.all = true;
    else positional.push(argv[i]);
  }
  return { positional, options };
}

function loadData(options) {
  const backlogDir = options["--backlog-dir"] ?? join(REPO_ROOT, "audit", "texo-v1", "backlog");
  const jiraMapFile = options["--jira-map"] ?? join(REPO_ROOT, "audit", "texo-v1", "jira-map.json");
  const referencesDir = options["--references-dir"] ?? join(REPO_ROOT, "skills", "texo-execute", "references");
  const tickets = new Map();
  for (const name of readdirSync(backlogDir).sort()) {
    if (!/^E\d+\.json$/.test(name)) continue;
    const parsed = readJson(join(backlogDir, name));
    for (const ticket of Array.isArray(parsed) ? parsed : parsed.tickets ?? []) tickets.set(ticket.id, ticket);
  }
  const keys = readJson(jiraMapFile).tickets ?? {};
  const byKey = new Map(Object.entries(keys).map(([local, key]) => [key, local]));
  const classMap = readJson(join(referencesDir, "class-map.json")).map ?? {};
  const templates = new Map();
  for (const name of readdirSync(referencesDir).sort()) {
    if (name.endsWith(".md")) templates.set(name.replace(/\.md$/, ""), readFileSync(join(referencesDir, name), "utf8"));
  }
  return { tickets, keys, byKey, classMap, templates };
}

function adrIds(ticket) {
  const text = [ticket.problem, ticket.value, ...(ticket.scope ?? []), ...(ticket.acceptance ?? []), ...(ticket.dependencies ?? [])].join("\n");
  return [...new Set((text.match(ADR_PATTERN) ?? []).map((id) => id.replace(" ", "-").toUpperCase().replace("ADR-", "ADR ")))].sort();
}

function pickClass(ticket, classMap, templates) {
  for (const label of ticket.labels ?? []) {
    const template = classMap[label];
    if (template && templates.has(template)) return template;
  }
  return undefined;
}

function bullets(items) {
  return (items ?? []).map((item) => `- ${item}`).join("\n");
}

export function renderPrompt(ticket, jiraKey, data) {
  const className = pickClass(ticket, data.classMap, data.templates);
  // Generic template body is reused for an unmapped ticket, with the class line replaced by a stop instruction.
  let template = data.templates.get(className ?? [...data.templates.keys()].sort()[0]);
  if (!className) {
    template = template.replace(/^Class:.*$/m, "Class: UNMAPPED. No label of this ticket maps to a class template: stop and ask the PO before implementing.");
  }
  const fill = {
    ticket: jiraKey,
    owned_files: ticket.filesTouched.join(", "),
    adr_ids: adrIds(ticket).join(", ") || "none",
    validation: (ticket.validation ?? []).join("; "),
    stop_rule: STOP_RULE,
    evidence: (ticket.evidence ?? []).join("; "),
  };
  const filled = template.replace(/\{(\w+)\}/g, (match, name) => (name in fill ? fill[name] : match));
  const body = [
    `# ${jiraKey} (${ticket.id}) ${ticket.title}`,
    `Dependencies: ${(ticket.dependencies ?? []).join(", ") || "none"}. Size ${ticket.size}, wave ${ticket.wave}.`,
    `Problem: ${ticket.problem}`,
    `Scope:\n${bullets(ticket.scope)}`,
    `Acceptance:\n${bullets(ticket.acceptance)}`,
  ].join("\n");
  return `${body}\n\n---\n${filled.trimEnd()}\n`;
}

function resolve(arg, data) {
  const local = data.byKey.get(arg) ?? arg;
  const ticket = data.tickets.get(local);
  return ticket ? { ticket, jiraKey: data.keys[ticket.id] ?? arg } : undefined;
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  if (!options.all && positional.length !== 1) {
    console.error("usage: ticket-prompt.mjs <PLRNUI-n|E18-05> | --all [--backlog-dir d] [--jira-map f] [--references-dir d]");
    return 2;
  }
  let data;
  try {
    data = loadData(options);
  } catch (error) {
    console.error(`cannot read backlog or templates: ${error.message}`);
    return 2;
  }
  if (!options.all) {
    const found = resolve(positional[0], data);
    if (!found) {
      console.error(`unknown ticket: ${positional[0]} (expected a Jira key such as PLRNUI-449 or a local id such as E18-06)`);
      return 2;
    }
    const prompt = renderPrompt(found.ticket, found.jiraKey, data);
    const tokens = estimateTokens(prompt);
    process.stdout.write(prompt);
    console.error(`estimated tokens: ${tokens}${tokens > BUDGET_TOKENS ? ` - OVER the ${BUDGET_TOKENS} budget, consider splitting ${found.ticket.id}` : ""}`);
    return 0;
  }
  const index = readJson(join(options["--backlog-dir"] ?? join(REPO_ROOT, "audit", "texo-v1", "backlog"), "_index.json"));
  const failures = [];
  const over = [];
  const unmapped = [];
  let rendered = 0;
  let maxTokens = 0;
  for (const entry of index) {
    const found = resolve(entry.id, data);
    if (!found) {
      failures.push(entry.id);
      continue;
    }
    const prompt = renderPrompt(found.ticket, found.jiraKey, data);
    const tokens = estimateTokens(prompt);
    rendered += 1;
    maxTokens = Math.max(maxTokens, tokens);
    if (tokens > BUDGET_TOKENS) over.push(`${entry.id}(${tokens})`);
    if (prompt.includes("Class: UNMAPPED")) unmapped.push(entry.id);
  }
  const share = rendered === 0 ? 0 : (rendered - over.length) / rendered;
  console.log(`rendered ${rendered}/${index.length} tickets; ${(share * 100).toFixed(1)}% within ${BUDGET_TOKENS} estimated tokens (max ${maxTokens})`);
  if (over.length > 0) console.log(`over budget, consider splitting: ${over.join(", ")}`);
  if (unmapped.length > 0) console.log(`no class mapping (prompt tells the session to ask the PO): ${unmapped.join(", ")}`);
  if (failures.length > 0) {
    console.error(`failed to render: ${failures.join(", ")}`);
    return 1;
  }
  return share >= REQUIRED_SHARE ? 0 : 1;
}

let code;
try {
  code = main();
} catch (error) {
  console.error(`ticket-prompt failed: ${error.message}`);
  code = 2;
}
process.exit(code);
