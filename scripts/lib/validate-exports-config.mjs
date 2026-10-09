#!/usr/bin/env node
// Validates config/exports.json, the single source of the package.json "exports" map (ADR 0009, D7).
// Dependency-free and fail-closed: exit 0 only when every check passes, 1 on validation errors,
// 2 on unreadable input, unknown arguments or unexpected exceptions.
// Usage: node scripts/lib/validate-exports-config.mjs [--config <path>] [--snapshot <path>]
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXPECTED_KEYS = ['.', './theme', './tokens', './native', './native/expo', './adapters/*', './testing', './meta', './package.json'];
const STABILITY = ['stable', 'beta', 'experimental', 'internal', 'deprecated'];
const CONDITIONS = ['types', 'react-native', 'import', 'default'];
const FORBIDDEN = /^\.\/(experimental|navigation|utils|hooks|components|src|dist|internal)(\/|$)/;
const SUBPATH_KEYS = ['stability', 'sideEffects', 'peers', 'conditions', 'symbols'];

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { config: resolve(root, 'config/exports.json'), snapshot: resolve(root, 'audit/api/public-root-api.snapshot') };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if ((flag !== '--config' && flag !== '--snapshot') || typeof value !== 'string') {
      throw new UsageError(`unknown or incomplete argument: ${flag}`);
    }
    opts[flag.slice(2)] = resolve(process.cwd(), value);
  }
  return opts;
}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length > 0);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function validateFile(errors, label, file, pattern) {
  if (typeof file !== 'string') return errors.push(`${label}: not a string`);
  if (!file.startsWith('./dist/')) errors.push(`${label}: must start with ./dist/ (got ${file})`);
  if (file.includes('..') || file.includes('//') || /(^|\/)(src|internal)(\/|$)/.test(file)) errors.push(`${label}: forbidden path segment (${file})`);
  if (file.includes('*') !== pattern) errors.push(`${label}: wildcard must appear exactly in the ./adapters/* subpath (${file})`);
}

function validate(config, snapshot) {
  const errors = [];
  if (!isObject(config)) return ['config is not an object'];
  if (config.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  const subpaths = config.subpaths;
  if (!isObject(subpaths)) return [...errors, 'subpaths must be an object'];

  const keys = Object.keys(subpaths);
  for (const k of EXPECTED_KEYS) if (!keys.includes(k)) errors.push(`missing subpath ${k}`);
  for (const k of keys) {
    if (!EXPECTED_KEYS.includes(k)) errors.push(`unexpected subpath ${k}`);
    if (FORBIDDEN.test(k)) errors.push(`forbidden subpath ${k} (ADR 0009)`);
  }
  if (!Array.isArray(config.rootReexports) || !config.rootReexports.every((k) => EXPECTED_KEYS.includes(k) && k !== '.' && k !== './package.json')) {
    errors.push('rootReexports must list subpaths other than "." and ./package.json');
  }

  const owner = new Map();
  for (const key of EXPECTED_KEYS) {
    const sp = subpaths[key];
    if (sp === undefined) continue;
    const at = `subpath ${key}`;
    if (!isObject(sp)) { errors.push(`${at}: not an object`); continue; }
    if (key === './package.json') {
      if (Object.keys(sp).join() !== 'file' || sp.file !== './package.json') errors.push(`${at}: must be exactly {"file": "./package.json"}`);
      continue;
    }
    for (const k of Object.keys(sp)) if (!SUBPATH_KEYS.includes(k)) errors.push(`${at}: unknown key ${k}`);
    for (const k of SUBPATH_KEYS) if (!(k in sp)) errors.push(`${at}: missing ${k}`);
    if (!STABILITY.includes(sp.stability)) errors.push(`${at}: stability must be one of ${STABILITY.join(', ')}`);
    if (typeof sp.sideEffects !== 'boolean') errors.push(`${at}: sideEffects must be a boolean`);
    if (!isObject(sp.peers) || !isStringArray(sp.peers.required) || !isStringArray(sp.peers.optional)) {
      errors.push(`${at}: peers must be {required: string[], optional: string[]}`);
    } else {
      for (const p of ['react', 'react-native']) if (!sp.peers.required.includes(p)) errors.push(`${at}: peers.required must include ${p}`);
      const all = [...sp.peers.required, ...sp.peers.optional];
      if (new Set(all).size !== all.length) errors.push(`${at}: a peer is listed twice`);
    }
    const c = sp.conditions;
    if (!isObject(c) || !sameSet(Object.keys(c), CONDITIONS)) {
      errors.push(`${at}: conditions must be exactly ${CONDITIONS.join(', ')}`);
    } else {
      const pattern = key === './adapters/*';
      for (const name of CONDITIONS) validateFile(errors, `${at} condition ${name}`, c[name], pattern);
      if (!(c['react-native'] === c.import && c.import === c.default)) errors.push(`${at}: react-native, import and default must point at the same file`);
      if (typeof c.import === 'string' && c.types !== c.import.replace(/\.js$/, '.d.ts')) errors.push(`${at}: types must be the .d.ts next to the import file`);
      if (typeof c.import === 'string' && !c.import.endsWith('.js')) errors.push(`${at}: import file must be an ESM .js file`);
    }
    if (!isStringArray(sp.symbols)) { errors.push(`${at}: symbols must be a string array`); continue; }
    for (const s of sp.symbols) {
      if (owner.has(s)) errors.push(`symbol ${s} assigned twice (${owner.get(s)} and ${key})`);
      else owner.set(s, key);
    }
  }

  for (const s of snapshot) if (!owner.has(s)) errors.push(`snapshot symbol ${s} is not assigned to any subpath`);
  const known = new Set(snapshot);
  for (const [s, key] of owner) if (!known.has(s)) errors.push(`symbol ${s} in ${key} is not in the public root API snapshot`);
  return errors;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(opts.config, 'utf8'));
  const snapshot = readFileSync(opts.snapshot, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  if (snapshot.length === 0) throw new UsageError('snapshot is empty');
  const errors = validate(config, snapshot);
  if (errors.length > 0) {
    for (const e of errors) console.error(`exports-config: ${e}`);
    console.error(`exports-config: ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(`exports-config ok: ${EXPECTED_KEYS.length} subpaths, ${snapshot.length} snapshot symbols assigned`);
} catch (error) {
  console.error(`exports-config: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}
