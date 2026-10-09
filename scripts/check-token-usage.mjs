import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Token-usage lint (PLRNUI-179): components must take colors from theme tokens, not literals.
// Scans <root>/src/components/**/*.tsx for hex, rgb(a), hsl(a) and CSS named colors inside string literals.
// Lines that contain "boxShadow" are skipped (shadow templates build rgba from tokens).
// Usage: check-token-usage.mjs [--root <dir>] [--allowlist <file>]
// Exit 0 clean, 1 violations or stale allowlist entries, 2 usage / unreadable input / invalid allowlist.
// The count of numeric literals in style objects is reported but never fails the run.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen"
  ).split(" "),
);

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])/;
const COLOR_FUNCTION = /\b(?:rgb|rgba|hsl|hsla)\s*\(/i;
const STYLE_KEYS =
  "width|height|minWidth|minHeight|maxWidth|maxHeight|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap|rowGap|columnGap|top|bottom|left|right|borderRadius|borderWidth|fontSize|lineHeight|letterSpacing|zIndex|opacity|elevation";
const NUMERIC_STYLE = new RegExp(`\\b(?:${STYLE_KEYS})\\s*:\\s*-?\\d+(?:\\.\\d+)?\\b`, "g");

class UsageError extends Error {}

/** String literals outside comments, per line. Handles // and block comments; template literals are scanned per line. */
function scanLiterals(source) {
  const found = [];
  let inBlock = false;
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    let quote = null;
    let current = "";
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      const next = line[i + 1];
      if (inBlock) {
        if (c === "*" && next === "/") {
          inBlock = false;
          i += 1;
        }
        continue;
      }
      if (quote) {
        if (c === "\\") {
          current += c + (next ?? "");
          i += 1;
        } else if (c === quote) {
          found.push({ line: index + 1, text: current, lineText: line });
          quote = null;
          current = "";
        } else current += c;
        continue;
      }
      if (c === "/" && next === "/") break;
      if (c === "/" && next === "*") {
        inBlock = true;
        i += 1;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        current = "";
      }
    }
    if (quote === "`" && current) found.push({ line: index + 1, text: current, lineText: line });
  });
  return { literals: found, numericStyleCount: (source.match(NUMERIC_STYLE) ?? []).length };
}

function findViolations(source) {
  const { literals, numericStyleCount } = scanLiterals(source);
  const violations = [];
  for (const literal of literals) {
    if (literal.lineText.includes("boxShadow")) continue;
    const value = literal.text.trim();
    if (HEX.test(value) || COLOR_FUNCTION.test(value) || NAMED_COLORS.has(value.toLowerCase())) {
      violations.push({ line: literal.line, match: value });
    }
  }
  return { violations, numericStyleCount };
}

function loadAllowlist(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new UsageError(`cannot read allowlist ${path}: ${error.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new UsageError(`allowlist ${path} is not valid JSON: ${error.message}`);
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.entries)) {
    throw new UsageError(`allowlist ${path} must be an object with an "entries" array`);
  }
  data.entries.forEach((entry, index) => {
    for (const key of ["file", "match", "reason"]) {
      if (typeof entry?.[key] !== "string" || entry[key].trim() === "") {
        throw new UsageError(`allowlist entry ${index} needs a non-empty string "${key}" (every entry requires a reason)`);
      }
    }
  });
  return data.entries;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function run(root, allowlistPath) {
  const componentsDir = join(root, "src", "components");
  let files;
  try {
    files = walk(componentsDir);
  } catch (error) {
    throw new UsageError(`cannot scan ${componentsDir}: ${error.message}`);
  }
  const entries = loadAllowlist(allowlistPath);
  const used = new Set();
  const violations = [];
  let numeric = 0;
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    const result = findViolations(readFileSync(file, "utf8"));
    numeric += result.numericStyleCount;
    for (const violation of result.violations) {
      const index = entries.findIndex((entry) => entry.file === rel && entry.match === violation.match);
      if (index >= 0) used.add(index);
      else violations.push(`${rel}:${violation.line}: ${violation.match}`);
    }
  }
  const stale = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ index }) => !used.has(index))
    .map(({ entry }) => `stale allowlist entry (matches nothing): ${entry.file} ${JSON.stringify(entry.match)}`);
  return { violations, stale, numeric, files: files.length };
}

function main(argv) {
  let root = REPO_ROOT;
  let allowlist = join(REPO_ROOT, "scripts", "token-usage.allowlist.json");
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root" && argv[i + 1]) root = resolve(argv[(i += 1)]);
    else if (argv[i] === "--allowlist" && argv[i + 1]) allowlist = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
  const result = run(root, allowlist);
  console.log(`numeric literals in style objects (informational, not failing): ${result.numeric}`);
  if (result.violations.length || result.stale.length) {
    for (const line of result.violations) console.error(`hardcoded color: ${line}`);
    for (const line of result.stale) console.error(line);
    console.error(`token usage check failed: ${result.violations.length} violation(s), ${result.stale.length} stale allowlist entr${result.stale.length === 1 ? "y" : "ies"}`);
    return 1;
  }
  console.log(`token usage ok (${result.files} component files scanned)`);
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`token usage check error: ${error.message}`);
  process.exitCode = 2;
}
