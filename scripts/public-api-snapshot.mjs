import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "src/index.ts"), "utf8");
const entries = [];
for (const match of source.matchAll(/export\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+["'][^"']+["'];/g)) {
  const kind = match[1] ? "type" : "value";
  for (const raw of match[2].split(",")) {
    const token = raw.trim();
    if (!token) continue;
    const name = token.split(/\s+as\s+/).at(-1)?.trim();
    if (name) entries.push(`${kind}:${name}`);
  }
}
for (const match of source.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) entries.push(`value:${match[1]}`);
entries.sort();
const output = entries.join("\n") + "\n";
const target = path.join(root, "audit/api/public-root-api.snapshot");
if (process.argv.includes("--check")) {
  const actual = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (actual !== output) {
    console.error("Public root API snapshot drift detected. Run npm run api:snapshot and review the explicit diff.");
    process.exit(1);
  }
  console.log(`Public API snapshot consistent (${entries.length} exports).`);
} else {
  fs.writeFileSync(target, output);
  console.log(`Wrote ${entries.length} root exports to audit/api/public-root-api.snapshot`);
}
