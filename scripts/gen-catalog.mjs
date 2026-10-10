#!/usr/bin/env node
// Catalog generator (PLRNUI-202, ADR 0016): regenerates the per-category component lists of docs/components.md and of
// docs/components/<category>/index.md from component meta, so a stability label is written in exactly one place (the
// meta `status`). Status is read only through scripts/lib/meta.mjs.
//   label mapping (docs/policies/stability.md): prototype -> experimental, demo -> beta,
//                                               stable | production-ready -> stable, deprecated -> deprecated
// Only the text between <!-- catalog:begin --> and <!-- catalog:end --> is generated; both markers must be present exactly
// once in each target file (fail closed otherwise). Components are ordered by category, then by name (byte order).
// Usage: node scripts/gen-catalog.mjs [--check] [--root <dir>]
//   (default)  write the files; exit 0
//   --check    write nothing; exit 1 listing every file that differs from what the generator would produce
// Exit 0 ok, 1 drift or meta/docs problems, 2 usage or unreadable input.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MetaError, lintMetas, loadMetas } from './lib/meta.mjs';

class UsageError extends Error {}

export const BEGIN = '<!-- catalog:begin -->';
export const END = '<!-- catalog:end -->';

export const LABELS = {
  prototype: 'experimental',
  demo: 'beta',
  stable: 'stable',
  'production-ready': 'stable',
  deprecated: 'deprecated',
};

export const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const title = (category) => category.charAt(0).toUpperCase() + category.slice(1);
const byteOrder = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Components grouped by category: [[category, [{ name, label, page }]]], both levels in byte order. */
export function groupMetas(entries) {
  const groups = new Map();
  for (const { meta } of entries) {
    if (!groups.has(meta.category)) groups.set(meta.category, []);
    groups.get(meta.category).push({ name: meta.name, label: LABELS[meta.status], page: `${kebab(meta.name)}.md` });
  }
  return [...groups.entries()]
    .sort(([a], [b]) => byteOrder(a, b))
    .map(([category, items]) => [category, items.sort((a, b) => byteOrder(a.name, b.name))]);
}

/** Generated block of docs/components.md. */
export function catalogBlock(groups) {
  const sections = groups.map(([category, items]) =>
    [
      `## ${title(category)}`,
      '',
      `- Overview: [${title(category)}](components/${category}/index.md)`,
      ...items.map((item) => `- [${item.name}](components/${category}/${item.page}) — ${item.label}`),
    ].join('\n'),
  );
  return sections.join('\n\n');
}

/** Generated block of docs/components/<category>/index.md. */
export function indexBlock(items) {
  return items.map((item) => `- [${item.name}](${item.page}) — ${item.label}`).join('\n');
}

/** Replaces the text between the markers; throws MetaError unless each marker appears exactly once, begin before end. */
export function splice(text, block, file) {
  const count = (marker) => text.split(marker).length - 1;
  if (count(BEGIN) !== 1 || count(END) !== 1) throw new MetaError(`${file}: needs exactly one ${BEGIN} and one ${END}`);
  const start = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (start > end) throw new MetaError(`${file}: ${BEGIN} must come before ${END}`);
  return `${text.slice(0, start + BEGIN.length)}\n${block}\n${text.slice(end)}`;
}

/** Every target file with its current and expected text: [{ file, current, expected }]. */
export function plan(root) {
  const entries = loadMetas(root);
  const problems = lintMetas(entries, { root });
  if (problems.length > 0) throw new MetaError(`${problems.join('\n')}\n${problems.length} metadata problem(s)`);
  const groups = groupMetas(entries);
  const targets = [{ file: 'docs/components.md', block: catalogBlock(groups) }];
  for (const [category, items] of groups) {
    for (const item of items) {
      const page = `docs/components/${category}/${item.page}`;
      if (!existsSync(join(root, page))) throw new MetaError(`${item.name}: docs page ${page} does not exist`);
    }
    targets.push({ file: `docs/components/${category}/index.md`, block: indexBlock(items) });
  }
  return targets.map(({ file, block }) => {
    const path = join(root, file);
    if (!existsSync(path)) throw new MetaError(`missing ${file}`);
    const current = readFileSync(path, 'utf8');
    return { file, current, expected: splice(current, block, file) };
  });
}

function parseArgs(argv, defaultRoot) {
  const opts = { check: false, root: defaultRoot };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--check') opts.check = true;
    else if (argv[i] === '--root' && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) opts.root = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
  return opts;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = parseArgs(process.argv.slice(2), resolve(here, '..'));
  if (!existsSync(opts.root) || !statSync(opts.root).isDirectory()) throw new UsageError(`not a directory: ${opts.root}`);
  const stale = plan(opts.root).filter((t) => t.current !== t.expected);
  if (opts.check) {
    if (stale.length > 0) {
      console.error(stale.map((t) => `${t.file}: out of date with component meta`).join('\n'));
      console.error(`${stale.length} file(s) out of date; run: node scripts/gen-catalog.mjs`);
      return 1;
    }
    console.log('catalog ok: docs match component meta');
    return 0;
  }
  for (const t of stale) writeFileSync(join(opts.root, t.file), t.expected);
  console.log(`catalog generated: ${stale.length} file(s) updated`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    if (error instanceof MetaError) {
      console.error(error.message);
      process.exitCode = 1;
    } else if (error instanceof UsageError) {
      console.error(error.message);
      process.exitCode = 2;
    } else {
      console.error(`unexpected error: ${error.stack ?? error}`);
      process.exitCode = 2;
    }
  }
}
