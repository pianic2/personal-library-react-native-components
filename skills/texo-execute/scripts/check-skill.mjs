import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(skillDir, "..", "..", "audit", "texo-v1", "backlog", "_index.json");
const errors = [];
const fail = (message) => errors.push(message);

const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";
if (/^description:\s*[>|]/m.test(front)) fail("description must be a single-line value");
const field = (key) => new RegExp(`^${key}:\\s*(.*)$`, "m").exec(front)?.[1]?.trim();
const folder = skillDir.split("/").pop();
if (field("name") !== folder) fail(`frontmatter name "${field("name")}" must equal folder "${folder}"`);
const description = field("description") ?? "";
if (description.length === 0 || description.length > 1024) fail(`description length ${description.length} not in 1..1024`);
if (skill.split("\n").length >= 200) fail("SKILL.md must be < 200 lines");
if (!/backlog\/E\*\.json/.test(skill)) fail("SKILL.md must instruct reading the ticket from the repo backlog JSON");
if (!/Approvato/.test(skill) || !/Jira status/.test(skill)) fail("SKILL.md must forbid transitioning to Approvato / changing the Jira status");

const refs = join(skillDir, "references");
const templates = readdirSync(refs).filter((f) => f.endsWith(".md"));
if (templates.length === 0) fail("no templates found");
for (const file of templates) {
  const text = readFileSync(join(refs, file), "utf8");
  const tokens = Math.ceil(text.length / 4);
  if (tokens > 400) fail(`${file}: ~${tokens} tokens > 400`);
  for (const placeholder of ["{ticket}", "{owned_files}", "{adr_ids}", "{validation}", "{stop_rule}", "{evidence}"]) {
    if (!text.includes(placeholder)) fail(`${file}: missing ${placeholder}`);
  }
}

const { ignore, map } = JSON.parse(readFileSync(join(refs, "class-map.json"), "utf8"));
// Meta labels that are not ticket classes. Hardcoded on purpose: the ignore list in the JSON must not be able to hide a class.
const META = ["texo-v1", "ready", "awaiting-po-approval", "e7"];
if (JSON.stringify([...ignore].sort()) !== JSON.stringify([...META].sort())) fail(`class-map ignore list must be exactly ${META.join(", ")}`);
for (const label of ignore) if (label in map) fail(`label ${label} is both ignored and mapped`);
const known = new Set(templates.map((f) => f.replace(/\.md$/, "")));
for (const [label, template] of Object.entries(map)) {
  if (!known.has(template)) fail(`label ${label} maps to missing template ${template}`);
}
const counts = new Map();
for (const ticket of JSON.parse(readFileSync(indexPath, "utf8"))) {
  for (const label of ticket.labels) counts.set(label, (counts.get(label) ?? 0) + 1);
}
for (const [label, n] of counts) {
  if (n >= 3 && !(label in map) && !ignore.includes(label)) fail(`label "${label}" (${n} tickets) has no template`);
}

if (errors.length > 0) {
  console.error("texo-execute check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`texo-execute check passed (${templates.length} templates, ${Object.keys(map).length} mapped labels)`);
