#!/usr/bin/env node
// Keeps the version the legacy shim is generated with in lockstep with the package version (PLRNUI-113, ADR 0013 item 3).
// The shim is not a workspace package: scripts/build-shim.mjs generates it, and the version it receives is recorded in
// .changeset/shim-version.json. `changeset version` bumps package.json; this script then copies that version into the record.
// Usage: node scripts/sync-shim-version.mjs [--root <dir>] [--check]
//   (no flag)  writes .changeset/shim-version.json = { "version": <package.json version> }
//   --check    writes nothing; exit 1 when the record is missing or differs from package.json
// Exit 0 ok, 1 stale or missing record, 2 usage or unreadable/invalid input. Deterministic.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

class UsageError extends Error {}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
export const RECORD = join('.changeset', 'shim-version.json');

function parseArgs(argv, defaultRoot) {
  const opts = { check: false, root: defaultRoot };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '--root' && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) opts.root = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${arg}`);
  }
  return opts;
}

/** The package version, validated. */
export function packageVersion(root) {
  const file = join(root, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new UsageError(`cannot read ${file}: ${error.message}`);
  }
  if (typeof pkg.version !== 'string' || !SEMVER.test(pkg.version)) throw new UsageError(`package.json has no valid semver version (found ${JSON.stringify(pkg.version)})`);
  return pkg.version;
}

export const render = (version) => `${JSON.stringify({ version }, null, 2)}\n`;

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = parseArgs(process.argv.slice(2), resolve(here, '..'));
  const version = packageVersion(opts.root);
  const target = join(opts.root, RECORD);
  const expected = render(version);
  if (opts.check) {
    const actual = existsSync(target) ? readFileSync(target, 'utf8') : undefined;
    if (actual !== expected) {
      console.error(`${RECORD} is missing or does not match package.json version ${version}. Run node scripts/sync-shim-version.mjs.`);
      return 1;
    }
    console.log(`shim version input is in lockstep (${version})`);
    return 0;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, expected);
  console.log(`shim version input set to ${version}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`sync-shim-version: ${error.message}`);
      process.exitCode = 2;
    } else {
      throw error;
    }
  }
}
