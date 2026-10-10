#!/usr/bin/env node
// Builds ai/manifests/props.json: the machine-readable props contract of every component value export of src/index.ts.
// Props come from scripts/ai/lib/extract-props.mjs, the maturity status from the metadata loader (ADR 0016, loadMetas).
// Deterministic (sorted keys and props, no timestamps, no absolute paths) and fail-closed: the manifest is validated
// against ai/schema/props.schema.json with ajv before it is written.
// CLI: node scripts/ai/build-props.mjs [--check] [--root <dir>] [--out <file>]
//   (default)  write the manifest (exit 0)
//   --check    do not write; exit 1 if the file on disk differs from the generated manifest
// Exit 1 on validation findings or drift, 2 on usage errors or unreadable input.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { extractProps } from './lib/extract-props.mjs';
import { lintMetas, loadMetas } from '../lib/meta.mjs';

export const MANIFEST_PATH = 'ai/manifests/props.json';
export const SCHEMA_PATH = 'ai/schema/props.schema.json';
export const SCHEMA_VERSION = 1;

export class BuildError extends Error {}

const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function readJson(file, what) {
  if (!existsSync(file)) throw new BuildError(`${what} not found: ${file}`);
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new BuildError(`${what} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function toProp(name, info) {
  const prop = {
    name,
    type: info.type,
    required: !info.optional,
    default: info.default !== undefined ? info.default : null,
    description: info.description ?? '',
  };
  if (info.defaultExpression !== undefined) prop.defaultExpression = info.defaultExpression;
  if (info.values !== undefined) prop.values = info.values;
  return prop;
}

/** Returns the manifest object for the repository at `root`. Throws BuildError when an input is inconsistent. */
export function buildManifest(root) {
  const pkg = readJson(resolve(root, 'package.json'), 'package.json');
  if (typeof pkg.name !== 'string' || typeof pkg.version !== 'string') throw new BuildError('package.json needs a string name and version');

  const entries = loadMetas(root);
  const metaErrors = lintMetas(entries, { root });
  if (metaErrors.length > 0) throw new BuildError(`component metadata is invalid:\n${metaErrors.join('\n')}`);
  const statusByName = new Map(entries.map((e) => [e.dir, e.meta.status]));

  const { components: extracted } = extractProps({ root });
  const components = {};
  for (const name of Object.keys(extracted).sort(compareText)) {
    const props = Object.keys(extracted[name].props)
      .sort(compareText)
      .map((propName) => toProp(propName, extracted[name].props[propName]));
    components[name] = statusByName.has(name) ? { status: statusByName.get(name), props } : { props };
  }
  return { schemaVersion: SCHEMA_VERSION, package: pkg.name, version: pkg.version, components };
}

/** Returns a list of schema violations (empty when valid). */
export function validateManifest(manifest, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (validate(manifest)) return [];
  return (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`);
}

export function serialize(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function parseArgs(argv, defaultRoot) {
  const opts = { check: false, root: defaultRoot, out: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if ((arg === '--root' || arg === '--out') && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) opts[arg.slice(2)] = argv[(i += 1)];
    else throw new BuildError(`unknown or incomplete argument: ${arg}`);
  }
  return opts;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = parseArgs(process.argv.slice(2), resolve(here, '..', '..'));
  const root = resolve(opts.root);
  const out = resolve(root, opts.out ?? MANIFEST_PATH);
  const manifest = buildManifest(root);
  const violations = validateManifest(manifest, readJson(resolve(root, SCHEMA_PATH), 'schema'));
  if (violations.length > 0) {
    console.error(violations.join('\n'));
    console.error(`${violations.length} schema violation(s); manifest not written`);
    return 1;
  }
  const text = serialize(manifest);
  const count = Object.keys(manifest.components).length;
  if (opts.check) {
    if (!existsSync(out) || readFileSync(out, 'utf8') !== text) {
      console.error(`${opts.out ?? MANIFEST_PATH} is out of date; run npm run ai:build:props`);
      return 1;
    }
    console.log(`props manifest up to date: ${count} components`);
    return 0;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`props manifest written: ${opts.out ?? MANIFEST_PATH} (${count} components)`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof BuildError || error instanceof Error && error.name === 'MetaError' ? error.message : `build-props: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
