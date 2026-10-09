import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMapping, transform } from './codemod.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'codemod.mjs');
const casesDir = join(here, 'fixtures', 'cases');
const mapping = loadMapping();
const dirs = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true });
});

function temp() {
  const dir = mkdtempSync(join(tmpdir(), 'codemod-'));
  dirs.push(dir);
  return dir;
}

function cli(args, cwd) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd });
}

const inputs = readdirSync(casesDir).filter((f) => f.includes('.input.')).sort();

function stage() {
  const dir = temp();
  for (const f of inputs) cpSync(join(casesDir, f), join(dir, f.replace('.input.', '.')));
  return dir;
}

describe('PLRNUI-265 codemod fixtures', () => {
  it('has at least 12 before/after cases, each with an expected file', () => {
    assert.ok(inputs.length >= 12);
    for (const f of inputs) assert.ok(existsSync(join(casesDir, f.replace('.input.', '.expected.'))), f);
  });

  for (const f of inputs) {
    it(`rewrites ${f} exactly as expected`, () => {
      const source = readFileSync(join(casesDir, f), 'utf8');
      const expected = readFileSync(join(casesDir, f.replace('.input.', '.expected.')), 'utf8');
      assert.equal(transform(source, f, mapping).text, expected);
    });
  }

  it('dry run reports changes and leaves every file untouched', () => {
    const dir = stage();
    const before = inputs.map((f) => readFileSync(join(dir, f.replace('.input.', '.')), 'utf8'));
    const out = cli([dir]);
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /would rewrite/);
    assert.match(out.stdout, /\(dry run\)/);
    assert.deepEqual(inputs.map((f) => readFileSync(join(dir, f.replace('.input.', '.')), 'utf8')), before);
  });

  it('--write produces the expected files, and a second run changes 0 files and leaves git diff empty', () => {
    const dir = stage();
    const first = cli(['--write', dir]);
    assert.equal(first.status, 0, first.stderr);
    for (const f of inputs) {
      assert.equal(readFileSync(join(dir, f.replace('.input.', '.')), 'utf8'), readFileSync(join(casesDir, f.replace('.input.', '.expected.')), 'utf8'), f);
    }
    const git = (...args) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd: dir, encoding: 'utf8' });
    assert.equal(git('init', '-q').status, 0);
    assert.equal(git('add', '-A').status, 0);
    assert.equal(git('commit', '-qm', 'after first run').status, 0);
    const second = cli(['--write', dir]);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /files changed: 0/);
    assert.equal(git('diff', '--exit-code').status, 0);
  });

  it('does not touch unrelated @personal-library specifiers', () => {
    const source = readFileSync(join(casesDir, '11-unrelated.input.ts'), 'utf8');
    const result = transform(source, 'x.ts', mapping);
    assert.equal(result.count, 0);
    assert.equal(result.text, source);
  });

  it('--check exits 1 when files would change and 0 when none would', () => {
    const dir = stage();
    assert.equal(cli(['--check', dir]).status, 1);
    assert.equal(cli(['--write', dir]).status, 0);
    assert.equal(cli(['--check', dir]).status, 0);
  });

  it('skips node_modules, dist and .git, and ignores non-source files', () => {
    const dir = temp();
    const line = `import { Button } from "${mapping.from}";\n`;
    for (const sub of ['node_modules/x', 'dist', '.git']) {
      mkdirSync(join(dir, sub), { recursive: true });
      writeFileSync(join(dir, sub, 'a.ts'), line);
    }
    writeFileSync(join(dir, 'notes.md'), line);
    const out = cli(['--write', dir]);
    assert.equal(out.status, 0);
    assert.match(out.stdout, /files scanned: 0/);
    assert.equal(readFileSync(join(dir, 'dist/a.ts'), 'utf8'), line);
  });
});

describe('PLRNUI-265 codemod fails closed', () => {
  it('exits 1 on a syntax error and leaves that file untouched while still rewriting the others', () => {
    const dir = temp();
    const bad = `import { Button } from "${mapping.from}";\nconst = ;\n`;
    writeFileSync(join(dir, 'bad.ts'), bad);
    writeFileSync(join(dir, 'good.ts'), `import { Button } from "${mapping.from}";\n`);
    const out = cli(['--write', dir]);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /bad\.ts: syntax error/);
    assert.equal(readFileSync(join(dir, 'bad.ts'), 'utf8'), bad);
    assert.match(readFileSync(join(dir, 'good.ts'), 'utf8'), /@texo-placeholder\/ui/);
  });

  it('exits 2 on usage errors', () => {
    const dir = temp();
    assert.equal(cli([]).status, 2);
    assert.equal(cli(['--bogus', dir]).status, 2);
    assert.equal(cli(['--write', '--check', dir]).status, 2);
    assert.equal(cli(['--mapping']).status, 2);
    assert.equal(cli(['--mapping', join(dir, 'missing.json'), dir]).status, 2);
  });

  it('rejects invalid or non-idempotent mappings', () => {
    const dir = temp();
    const write = (value) => {
      const file = join(dir, 'm.json');
      writeFileSync(file, JSON.stringify(value));
      return file;
    };
    const ok = { schemaVersion: 1, from: '@a/b', to: '@c/d' };
    assert.deepEqual(loadMapping(write(ok)), { from: '@a/b', to: '@c/d' });
    for (const bad of [
      { ...ok, schemaVersion: 2 },
      { ...ok, extra: true },
      { ...ok, to: '@a/b' },
      { ...ok, to: '@a/b/sub' },
      { ...ok, from: '@c/d/sub' },
      { ...ok, to: 'has space' },
      { ...ok, from: '' },
      { schemaVersion: 1, from: '@a/b' },
    ]) {
      assert.throws(() => loadMapping(write(bad)), /mapping/);
    }
  });

  it('the default mapping is a placeholder target and does not rename the real package', () => {
    const pkg = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8'));
    assert.equal(mapping.from, pkg.name);
    assert.notEqual(mapping.to, pkg.name);
  });
});
