#!/usr/bin/env node
// Checks the public props of every exported *Props type against ADR 0014 (API conventions).
// Components are discovered from the entry file; adding a component needs no edit here.
// Pre-existing violations are listed in scripts/api-conventions.baseline.json; new ones fail.
// Usage: node scripts/check-api-conventions.mjs [--root <dir>] [--entry <file>] [--baseline <file>]
// Exit codes: 0 ok, 1 new violations (or an unreadable/invalid baseline), 2 usage or program error.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const COLOUR_NAMES = new Set(['primary', 'secondary', 'danger', 'info', 'success', 'warning', 'error', 'neutral', 'accent']);
const SIZES = new Set(['xs', 'sm', 'md', 'lg']);
const TONES = new Set(['primary', 'neutral', 'success', 'warning', 'danger', 'info']);
// Typography components may also use `xl` and larger (ADR 0014, Visual axes).
const DISPLAY = /^(Text|Heading|B|P|Small|Quote|CodeInline)Props$/;
const PROVIDER = /(Provider|Host)Props$/;
const RULES = [
  'controlled-onChange', 'open-state', 'variant-colour', 'tone-values', 'color-prop', 'size-values',
  'error-boolean', 'invalid-type', 'passthrough-style', 'passthrough-testID',
];

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { root: resolve(here, '..'), entry: 'src/index.ts', baseline: resolve(here, 'api-conventions.baseline.json') };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!['--root', '--entry', '--baseline'].includes(flag) || value === undefined || value.startsWith('--')) throw new UsageError(`unknown or incomplete argument: ${flag}`);
    opts[flag.slice(2)] = value;
  }
  opts.root = resolve(opts.root);
  opts.baseline = resolve(opts.baseline);
  return opts;
}

function compilerOptions(root) {
  const file = resolve(root, 'tsconfig.json');
  if (!existsSync(file)) return { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true };
  const read = ts.readConfigFile(file, ts.sys.readFile);
  if (read.error) throw new UsageError(`tsconfig.json: ${ts.flattenDiagnosticMessageText(read.error.messageText, '\n')}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
  if (parsed.errors.length > 0) throw new UsageError(`tsconfig.json: ${parsed.errors.map((e) => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('; ')}`);
  return { ...parsed.options, noEmit: true };
}

function literalValues(checker, type) {
  const bare = checker.getNonNullableType(type);
  const members = bare.isUnion() ? bare.types : [bare];
  return members.every((t) => t.isStringLiteral()) ? members.map((t) => t.value) : null;
}

function mentionsBoolean(checker, type) {
  const bare = checker.getNonNullableType(type);
  const members = bare.isUnion() ? bare.types : [bare];
  return members.some((t) => t.flags & ts.TypeFlags.BooleanLike);
}

export function collectViolations({ root, entry }) {
  const entryFile = resolve(root, entry);
  if (!existsSync(entryFile)) throw new UsageError(`entry not found: ${entry}`);
  const program = ts.createProgram([entryFile], compilerOptions(root));
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new UsageError(`entry has no exports: ${entry}`);

  const violations = [];
  let inspected = 0;
  const exported = checker.getExportsOfModule(moduleSymbol).filter((s) => /Props$/.test(s.name)).sort((a, b) => a.name.localeCompare(b.name));
  for (const exportSymbol of exported) {
    const symbol = exportSymbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exportSymbol) : exportSymbol;
    if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
    inspected++;
    const name = exportSymbol.name;
    const props = new Map();
    for (const prop of checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))) {
      const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
      const own = Boolean(declaration) && !declaration.getSourceFile().fileName.includes('/node_modules/');
      props.set(prop.name, { own, type: declaration ? checker.getTypeOfSymbolAtLocation(prop, declaration) : undefined });
    }
    const add = (rule, detail) => violations.push({ props: name, rule, detail });
    const own = (propName) => (props.get(propName)?.own ? props.get(propName) : undefined);

    if (own('onChange')) add('controlled-onChange', 'own `onChange`: use `onValueChange(value)`');
    for (const legacy of ['visible', 'isOpen']) if (own(legacy)) add('open-state', `own \`${legacy}\`: use \`open\` / \`defaultOpen\` / \`onOpenChange\``);
    if (own('color') || own('colorScheme')) add('color-prop', 'own `color`/`colorScheme`: use `tone`');
    const variant = own('variant');
    if (variant?.type) {
      const values = literalValues(checker, variant.type);
      if (values?.some((v) => COLOUR_NAMES.has(v))) add('variant-colour', `\`variant\` carries colour names (${values.filter((v) => COLOUR_NAMES.has(v)).join(', ')}): variant is structure, colour is \`tone\``);
    }
    const tone = own('tone');
    if (tone?.type) {
      const values = literalValues(checker, tone.type);
      if (!values || values.some((v) => !TONES.has(v))) add('tone-values', '`tone` must be a union of primary | neutral | success | warning | danger | info');
    }
    const size = own('size');
    if (size?.type && !DISPLAY.test(name)) {
      const values = literalValues(checker, size.type);
      if (!values || values.some((v) => !SIZES.has(v))) add('size-values', '`size` must be a union of xs | sm | md | lg (larger sizes only on typography components)');
    }
    const error = own('error');
    if (error?.type && mentionsBoolean(checker, error.type)) add('error-boolean', '`error` holds the message (string); use `invalid` for the boolean state');
    const invalid = own('invalid');
    if (invalid?.type && !mentionsBoolean(checker, invalid.type)) add('invalid-type', '`invalid` must be boolean');
    if (!PROVIDER.test(name)) {
      if (!props.has('style')) add('passthrough-style', 'missing `style` passthrough');
      if (!props.has('testID')) add('passthrough-testID', 'missing `testID` passthrough');
    }
  }
  if (inspected === 0) throw new UsageError(`no exported *Props types found in ${entry}`);
  return { violations, inspected };
}

export function loadBaseline(file) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read baseline ${file}: ${error.message}`);
  }
  if (raw?.schemaVersion !== 1 || !Array.isArray(raw.entries)) throw new Error('baseline: schemaVersion must be 1 and entries an array');
  const keys = new Set();
  for (const entry of raw.entries) {
    if (!entry || typeof entry.props !== 'string' || !RULES.includes(entry.rule)) throw new Error(`baseline: invalid entry ${JSON.stringify(entry)}`);
    keys.add(`${entry.props}:${entry.rule}`);
  }
  if (keys.size !== raw.entries.length) throw new Error('baseline: duplicate entries');
  return keys;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { violations, inspected } = collectViolations(opts);
  let baseline;
  try {
    baseline = loadBaseline(opts.baseline);
  } catch (error) {
    console.error(`api-conventions: ${error.message}`);
    return 1;
  }
  const seen = new Set(violations.map((v) => `${v.props}:${v.rule}`));
  const fresh = violations.filter((v) => !baseline.has(`${v.props}:${v.rule}`));
  for (const v of fresh) console.error(`api-conventions: ${v.props}: [${v.rule}] ${v.detail}`);
  for (const key of [...baseline].filter((k) => !seen.has(k)).sort()) console.log(`api-conventions: baseline entry ${key} no longer occurs; remove it from the baseline`);
  console.log(`api-conventions: ${inspected} props types inspected, ${violations.length - fresh.length} baseline violation(s), ${fresh.length} new`);
  return fresh.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`api-conventions: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
