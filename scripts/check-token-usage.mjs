import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Token-usage lint (PLRNUI-179): components must take colors from theme tokens, not literals.
// Scans <root>/src/components/**/*.tsx for hex, rgb(a), hsl(a) and CSS named colors inside string literals.
// The value of a boxShadow property is exempt (shadow templates build rgba from tokens).
// Policy: hex, rgb(a)/hsl(a) are found in any string; a CSS named color or a short digit-only hex is found when the whole
// string is that color or the string looks like a CSS value (a length with a unit, or solid/dashed/dotted/inset/gradient).
// Usage: check-token-usage.mjs [--root <dir>] [--allowlist <file>]
// Exit 0 clean, 1 violations or stale allowlist entries, 2 usage / unreadable input / invalid allowlist.
// An allowlist entry is keyed by file + matched token: it suppresses every identical token in that file (not one line).
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

const COLOR_FUNCTION = /\b(?:rgb|rgba|hsl|hsla)\s*\([^)]*\)?/gi;
const HEX_TOKEN = /(?<![\w/&])#([0-9a-fA-F]+)(?![0-9a-zA-Z_-])/g;
// A string "looks like a CSS value" when it has a length with a unit or a border/shadow/gradient keyword.
// Only then are named colors and short digit-only hex values searched inside a longer string.
const CSS_VALUE = /(?:^|[\s,(])-?\d*\.?\d+(?:px|em|rem|pt|vh|vw|%)(?=$|[\s,)])|\b(?:solid|dashed|dotted|inset|gradient)\b/i;
const STYLE_KEYS =
  "width|height|minWidth|minHeight|maxWidth|maxHeight|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap|rowGap|columnGap|top|bottom|left|right|borderRadius|borderWidth|fontSize|lineHeight|letterSpacing|zIndex|opacity|elevation|flex";
const NUMERIC_STYLE = new RegExp(`\\b(?:${STYLE_KEYS})\\s*:\\s*-?\\d+(?:\\.\\d+)?\\b`, "g");

class UsageError extends Error {}

/**
 * Lex the whole file once (not line by line): comments, string literals, template literals (multi-line, with
 * ${...} expressions lexed as code) and regex literals. Returns the literal segments plus the source with
 * comments and literal bodies blanked out (used for the numeric count).
 * Heuristics for JSX text: "//" right after ":" is a URL, not a comment; a "'" right after a word character is an
 * apostrophe; a quote with no closing quote on the same line is plain text; "/" never starts a regex before ">"
 * (JSX "/>") and does after operators, opening punctuation and keywords such as return.
 * An unterminated template literal or block comment is an error (exit 2), not a silent skip.
 */
function lex(src) {
  const n = src.length;
  const code = src.split("");
  const segments = [];
  let i = 0;

  const blank = (from, to) => {
    for (let k = from; k < to && k < n; k += 1) if (src[k] !== "\n") code[k] = " ";
  };
  // A "/" starts a regex literal after an operator or opening punctuation, or after a keyword such as return.
  // "/>" (JSX self-closing tag) never starts one: that case is excluded at the call site.
  const regexAllowedAfter = (index) => {
    let k = index - 1;
    while (k >= 0 && /\s/.test(src[k])) k -= 1;
    if (k < 0) return true;
    if (/[(,=:[!&|?{};]/.test(src[k])) return true;
    const word = /[A-Za-z]+$/.exec(src.slice(Math.max(0, k - 10), k + 1));
    return word !== null && ["return", "typeof", "case", "void", "delete", "in", "of", "else", "do"].includes(word[0]);
  };

  function scanCode(untilBrace) {
    let depth = 0;
    while (i < n) {
      const c = src[i];
      const next = src[i + 1];
      if (c === "/" && next === "/" && src[i - 1] !== ":") {
        const end = src.indexOf("\n", i);
        const stop = end === -1 ? n : end;
        blank(i, stop);
        i = stop;
        continue;
      }
      if (c === "/" && next === "*") {
        const end = src.indexOf("*/", i + 2);
        if (end === -1) throw new UsageError("unterminated block comment");
        const stop = end + 2;
        blank(i, stop);
        i = stop;
        continue;
      }
      if (c === '"' || (c === "'" && !/[A-Za-z0-9]/.test(src[i - 1] ?? ""))) {
        let j = i + 1;
        while (j < n && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
        if (src[j] === c) {
          segments.push({ text: src.slice(i + 1, j), start: i + 1, open: i });
          blank(i, j + 1);
          i = j + 1;
          continue;
        }
      }
      if (c === "`") {
        const open = i;
        i += 1;
        let textStart = i;
        let closed = false;
        const pushChunk = (to) => {
          segments.push({ text: src.slice(textStart, to), start: textStart, open });
          blank(textStart, to);
        };
        while (i < n) {
          if (src[i] === "\\") i += 2;
          else if (src[i] === "$" && src[i + 1] === "{") {
            pushChunk(i);
            i += 2;
            scanCode(true);
            textStart = i;
          } else if (src[i] === "`") {
            pushChunk(i);
            i += 1;
            closed = true;
            break;
          } else i += 1;
        }
        if (!closed) throw new UsageError("unterminated template literal");
        continue;
      }
      if (c === "/" && next !== "/" && next !== "*" && next !== ">" && regexAllowedAfter(i)) {
        let j = i + 1;
        let inClass = false;
        while (j < n && src[j] !== "\n") {
          if (src[j] === "\\") j += 1;
          else if (src[j] === "[") inClass = true;
          else if (src[j] === "]") inClass = false;
          else if (src[j] === "/" && !inClass) break;
          j += 1;
        }
        if (src[j] === "/") {
          blank(i, j + 1);
          i = j + 1;
          continue;
        }
      }
      if (untilBrace) {
        if (c === "{") depth += 1;
        else if (c === "}") {
          if (depth === 0) {
            i += 1;
            return;
          }
          depth -= 1;
        }
      }
      i += 1;
    }
  }

  scanCode(false);
  return { segments, code: code.join("") };
}

function findInLiteral(text) {
  const tokens = [];
  const trimmed = text.trim();
  const cssLike = CSS_VALUE.test(text);
  for (const m of text.matchAll(HEX_TOKEN)) {
    const digits = m[1];
    if (![3, 4, 6, 8].includes(digits.length)) continue;
    if (/[a-fA-F]/.test(digits) || digits.length >= 6 || trimmed === m[0] || cssLike) tokens.push({ token: m[0], index: m.index });
  }
  for (const m of text.matchAll(COLOR_FUNCTION)) tokens.push({ token: m[0].trim(), index: m.index });
  if (NAMED_COLORS.has(trimmed.toLowerCase())) tokens.push({ token: trimmed, index: text.indexOf(trimmed) });
  else if (cssLike) {
    for (const m of text.matchAll(/[A-Za-z]+/g)) {
      if (NAMED_COLORS.has(m[0].toLowerCase())) tokens.push({ token: m[0], index: m.index });
    }
  }
  return tokens;
}

/** Color literals in one source file plus the (informational) numeric style literal count. */
function findViolations(source) {
  const { segments, code } = lex(source);
  const lineStarts = [0];
  for (let k = 0; k < source.length; k += 1) if (source[k] === "\n") lineStarts.push(k + 1);
  const lineOf = (offset) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const violations = [];
  for (const segment of segments) {
    // The value of a boxShadow property is exempt (shadow templates build rgba from tokens).
    const before = source.slice(lineStarts[lineOf(segment.open) - 1], segment.open);
    if (/boxShadow\s*:\s*$/.test(before)) continue;
    for (const { token, index } of findInLiteral(segment.text)) {
      violations.push({ line: lineOf(segment.start + index), match: token });
    }
  }
  violations.sort((a, b) => a.line - b.line);
  return { violations, numericStyleCount: (code.match(NUMERIC_STYLE) ?? []).length };
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
    let result;
    try {
      result = findViolations(readFileSync(file, "utf8"));
    } catch (error) {
      throw new UsageError(`${rel}: ${error.message}`);
    }
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
