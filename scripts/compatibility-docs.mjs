import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Renders docs/compatibility.md and the "validated runtimes" block of docs/platform-support.md from
// package.json and config/compatibility.json. `--check` fails (exit 1) when the docs drift; invalid config exits 2.
// Config schema (version 2): { schemaVersion, claim, tiers: {name: description}, entries: [{expo, rn, react, platform,
// runtime, tier, lastVerified, evidence}] }. Every entry needs evidence: a repo file that exists or an https URL.

const root = process.cwd();
const PLATFORMS = ["ios", "android", "web"];
const ENTRY_KEYS = ["expo", "rn", "react", "platform", "runtime", "tier", "lastVerified", "evidence"];
const VERSION = /^\d+\.\d+\.\d+$/;
const BEGIN = "<!-- BEGIN GENERATED: validated runtimes (npm run docs:compat) -->";
const END = "<!-- END GENERATED: validated runtimes -->";

class ConfigError extends Error {}

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  } catch (error) {
    throw new ConfigError(`cannot read ${what} (${file}): ${error.message}`);
  }
}

function isRealDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validate(governed) {
  if (governed === null || typeof governed !== "object" || Array.isArray(governed)) throw new ConfigError("config/compatibility.json must be an object");
  if (governed.schemaVersion !== 2) throw new ConfigError(`unsupported schemaVersion: ${governed.schemaVersion} (expected 2)`);
  const tiers = governed.tiers;
  if (tiers === null || typeof tiers !== "object" || Array.isArray(tiers) || Object.keys(tiers).length === 0) throw new ConfigError("tiers must be a non-empty object");
  for (const [name, description] of Object.entries(tiers)) {
    if (typeof description !== "string" || description.trim() === "") throw new ConfigError(`tier "${name}" needs a description`);
  }
  if (!Array.isArray(governed.entries) || governed.entries.length === 0) throw new ConfigError("entries must be a non-empty array");
  const seen = new Set();
  governed.entries.forEach((entry, index) => {
    const where = `entries[${index}]`;
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new ConfigError(`${where} must be an object`);
    for (const key of Object.keys(entry)) if (!ENTRY_KEYS.includes(key)) throw new ConfigError(`${where}: unknown key "${key}"`);
    for (const key of ENTRY_KEYS) {
      if (typeof entry[key] !== "string" || entry[key].trim() === "") {
        throw new ConfigError(key === "evidence" ? `${where}: evidence is required (a repo file or an https URL)` : `${where}: "${key}" must be a non-empty string`);
      }
    }
    for (const key of ["expo", "rn", "react"]) if (!VERSION.test(entry[key])) throw new ConfigError(`${where}: "${key}" must be a version like 1.2.3, got "${entry[key]}"`);
    if (!PLATFORMS.includes(entry.platform)) throw new ConfigError(`${where}: platform must be one of ${PLATFORMS.join(", ")}`);
    if (!Object.hasOwn(tiers, entry.tier)) throw new ConfigError(`${where}: unknown tier "${entry.tier}"`);
    if (!isRealDate(entry.lastVerified)) throw new ConfigError(`${where}: lastVerified must be a calendar date YYYY-MM-DD`);
    const isUrl = /^https:\/\/\S+$/.test(entry.evidence);
    if (!isUrl && !(entry.evidence.indexOf("..") === -1 && fs.existsSync(path.join(root, entry.evidence)))) {
      throw new ConfigError(`${where}: evidence "${entry.evidence}" is neither an https URL nor an existing repo file`);
    }
    const id = [entry.expo, entry.rn, entry.react, entry.platform, entry.runtime].join("|");
    if (seen.has(id)) throw new ConfigError(`${where}: duplicate entry for ${id}`);
    seen.add(id);
  });
  if (!governed.entries.some((entry) => entry.tier === "supported")) throw new ConfigError("at least one entry must have tier \"supported\"");
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

const platformName = { ios: "iOS", android: "Android", web: "Web" };

function runtimeRows(entries) {
  return entries.map((e) => [platformName[e.platform], e.runtime, `\`${e.expo}\``, `\`${e.rn}\``, `\`${e.react}\``, e.tier, e.lastVerified]);
}

function render() {
  const pkg = readJson("package.json", "package.json");
  const governed = readJson("config/compatibility.json", "config/compatibility.json");
  validate(governed);
  const model = { packageVersion: pkg.version, react: pkg.peerDependencies?.react, reactNative: pkg.peerDependencies?.["react-native"], node: pkg.engines?.node };
  for (const [key, value] of Object.entries(model)) {
    if (value == null || value === "") throw new ConfigError(`Missing compatibility field: ${key}`);
  }
  const supported = governed.entries.filter((entry) => entry.tier === "supported");
  const sdks = [...new Set(supported.map((entry) => entry.expo.split(".")[0]))].join(", ");
  const tiers = table(["Tier", "Meaning"], Object.entries(governed.tiers).map(([name, description]) => [`\`${name}\``, description]));
  const entries = table(
    ["Platform", "Runtime", "Expo", "React Native", "React", "Tier", "Last verified", "Evidence"],
    governed.entries.map((e) => [...runtimeRows([e])[0], `\`${e.evidence}\``]),
  );
  const compatibility = `# Consumer Compatibility\n\n<!-- GENERATED by npm run docs:compat. Do not edit compatibility values manually. -->\n\n- Package candidate: \`${model.packageVersion}\`\n- React peer: \`${model.react}\`\n- React Native peer: \`${model.reactNative}\`\n- Node engine: \`${model.node}\`\n- Expo SDK validated baseline: \`${sdks}\`\n\nExpo is a governed validation baseline; it is not inferred from the React Native peer range.\n\n## Support tiers\n\n${tiers}\n\n## Validated consumers\n\n${entries}\n\nEvery row has evidence. Adding a version or runtime means adding an entry with its evidence in \`config/compatibility.json\`, then running \`npm run docs:compat\`.\n`;
  const block = `${BEGIN}\n\n${table(["Platform", "Runtime", "Expo", "React Native", "React", "Tier", "Last verified"], runtimeRows(governed.entries))}\n\nGenerated from \`config/compatibility.json\`; see [Consumer Compatibility](compatibility.md) for tiers and evidence.\n\n${END}`;
  return { compatibility, block };
}

function replaceBlock(text, block) {
  const start = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (start === -1 || end === -1 || end < start) throw new ConfigError("docs/platform-support.md is missing the generated block markers");
  return text.slice(0, start) + block + text.slice(end + END.length);
}

try {
  const { compatibility, block } = render();
  const compatTarget = path.join(root, "docs/compatibility.md");
  const platformTarget = path.join(root, "docs/platform-support.md");
  const platformText = fs.existsSync(platformTarget) ? fs.readFileSync(platformTarget, "utf8") : "";
  const platformOutput = replaceBlock(platformText, block);
  const mode = process.argv[2] ?? "write";
  if (mode === "--check") {
    const actual = fs.existsSync(compatTarget) ? fs.readFileSync(compatTarget, "utf8") : "";
    if (actual !== compatibility) {
      console.error("docs/compatibility.md drifts from package.json or config/compatibility.json. Run npm run docs:compat.");
      process.exit(1);
    }
    if (platformText !== platformOutput) {
      console.error("docs/platform-support.md drifts from package.json or config/compatibility.json. Run npm run docs:compat.");
      process.exit(1);
    }
    console.log("Compatibility documentation is consistent.");
  } else if (mode === "write") {
    fs.writeFileSync(compatTarget, compatibility);
    fs.writeFileSync(platformTarget, platformOutput);
    console.log("Generated docs/compatibility.md and the validated runtimes block of docs/platform-support.md");
  } else {
    throw new ConfigError(`unknown argument: ${mode}`);
  }
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`compatibility config error: ${error.message}`);
    process.exit(2);
  }
  throw error;
}
