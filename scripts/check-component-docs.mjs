#!/usr/bin/env node
// Component docs lint (PLRNUI-199): every component page docs/components/<category>/<kebab-name>.md must have
//   ## Import, ## Props, ## Usage (with a ```tsx fence inside Usage) and a "**Stability:** <label>" line whose label fits the
//   component's status in its meta file (ADR 0011 mapping):
//     prototype -> experimental | internal (ADR 0003: existing pages say "internal / non-stable")   demo -> beta | experimental
//     stable | production-ready -> stable      deprecated -> deprecated
// Status is read only through scripts/lib/meta.mjs. Report-only by default (lists the missing sections per page, exit 0);
// --strict exits 1 on any problem. A component without a page is a problem too.
// Usage: node scripts/check-component-docs.mjs [--strict] [--json] [--root <dir>]   Exit 0 ok, 1 strict failures, 2 usage/unreadable.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MetaError, loadMetas } from './lib/meta.mjs';

class UsageError extends Error {}

export const LABELS = {
  prototype: ['experimental', 'internal'],
  demo: ['beta', 'experimental'],
  stable: ['stable'],
  'production-ready': ['stable'],
  deprecated: ['deprecated'],
};

export const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Problems of one page's text: an array of strings (empty when the page is complete for `status`). */
export function checkPage(text, status) {
  const problems = [];
  // Sections and the Stability label come from prose only: lines inside a fenced block (``` or ~~~, any length >= 3) are
  // never headings or labels. A fence is closed by a fence of the same character that is at least as long.
  const sections = new Map();
  const prose = [];
  let current = null;
  let open = null; // { char, length } of the open fence
  for (const line of text.split(/\r?\n/)) {
    const fence = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (open) {
      if (fence && fence[1][0] === open.char && fence[1].length >= open.length && fence[2].trim() === '') open = null;
      if (current !== null) sections.get(current).fenced.push(line);
      continue;
    }
    if (fence) {
      open = { char: fence[1][0], length: fence[1].length };
      if (current !== null) {
        sections.get(current).fenced.push(line);
        if (fence[1][0] === '`' && /^tsx\b/.test(fence[2].trim())) sections.get(current).tsx = true;
      }
      continue;
    }
    prose.push(line);
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = heading[1];
      sections.set(current, { fenced: [], tsx: false });
    }
  }
  for (const name of ['Import', 'Props', 'Usage']) if (!sections.has(name)) problems.push(`missing "## ${name}"`);
  if (sections.has('Usage') && !sections.get('Usage').tsx) problems.push('"## Usage" has no ```tsx fence');
  if (open) problems.push('unclosed code fence');
  const label = /^\*\*Stability:\*\*\s*([A-Za-z-]+)/m.exec(prose.join('\n'))?.[1];
  const allowed = LABELS[status];
  if (!label) problems.push('missing "**Stability:**" label');
  else if (!allowed) problems.push(`unknown status "${status}"`);
  else if (label !== label.toLowerCase()) problems.push(`Stability label "${label}" must be lower case`);
  else if (!allowed.includes(label)) problems.push(`Stability label "${label}" does not fit status "${status}" (expected ${allowed.join(' or ')})`);
  return problems;
}

export function checkDocs(root) {
  const rows = [];
  for (const { dir, meta } of loadMetas(root)) {
    if (!meta || typeof meta.category !== 'string') {
      rows.push({ name: dir, page: null, problems: ['no valid meta (run scripts/lib/meta.mjs --lint)'] });
      continue;
    }
    const page = `docs/components/${meta.category}/${kebab(dir)}.md`;
    const file = join(root, page);
    if (!existsSync(file) || !statSync(file).isFile()) rows.push({ name: dir, page, problems: ['page does not exist'] });
    else rows.push({ name: dir, page, problems: checkPage(readFileSync(file, 'utf8'), meta.status) });
  }
  return rows;
}

function main() {
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let strict = false;
  let json = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--strict') strict = true;
    else if (argv[i] === '--json') json = true;
    else if (argv[i] === '--root' && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) root = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new UsageError(`not a directory: ${root}`);
  const rows = checkDocs(root);
  const failing = rows.filter((r) => r.problems.length > 0);
  if (json) process.stdout.write(`${JSON.stringify({ strict, pages: rows.length, failing: failing.length, rows }, null, 2)}\n`);
  else {
    for (const row of failing) console.log(`${row.page ?? row.name}\n${row.problems.map((p) => `  - ${p}`).join('\n')}`);
    console.log(`${rows.length} component pages; ${failing.length} with problems${strict ? '' : ' (report-only: pass --strict to fail)'}`);
  }
  return strict && failing.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof UsageError || error instanceof MetaError ? error.message : `unexpected error: ${error.stack ?? error}`);
    process.exitCode = 2;
  }
}
