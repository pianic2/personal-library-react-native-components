import { readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Single source of the package identity (PLRNUI-215). Scripts read the package name from here instead of
// hardcoding it, so the cutover changes one file. This file only holds the CURRENT name today: nothing is renamed.
// Config: config/package-identity.json { current, legacy, shim: { enabled } }.
// Importing this module loads and validates the default config and throws when it is invalid (fail-closed).
// Running it directly prints the current name. With an invalid config the import throws, so Node exits non-zero
// with the validation error (no helper can be imported when the config is broken).
// Limits: JSON.parse keeps the last of duplicate keys (the file is small and reviewed); names are validated against
// the rules for NEW npm packages (lowercase, no leading "." or "_"), so a legacy name with uppercase letters would be
// rejected; npm-reserved names such as core module names are not blacklisted.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_IDENTITY_FILE = join(REPO_ROOT, "config", "package-identity.json");

// npm package name: optional lowercase scope, URL-safe characters only.
const NPM_NAME = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkKeys(object, allowed, where) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) throw new Error(`${where}: unknown key "${key}"`);
  }
}

function checkName(value, where) {
  if (typeof value !== "string" || value.length > 214 || !NPM_NAME.test(value)) {
    throw new Error(`${where} must be a valid npm package name, got ${JSON.stringify(value)}`);
  }
}

/** Validate an identity object and return it frozen. Throws on anything unexpected. */
export function validateIdentity(data) {
  if (!isPlainObject(data)) throw new Error("identity must be a JSON object");
  checkKeys(data, ["current", "legacy", "shim"], "identity");
  checkName(data.current, "identity.current");
  if (data.legacy !== null) {
    checkName(data.legacy, "identity.legacy");
    if (data.legacy === data.current) throw new Error("identity.legacy must differ from identity.current");
  }
  if (!isPlainObject(data.shim)) throw new Error("identity.shim must be an object");
  checkKeys(data.shim, ["enabled"], "identity.shim");
  if (typeof data.shim.enabled !== "boolean") throw new Error("identity.shim.enabled must be a boolean");
  if (data.shim.enabled && data.legacy === null) throw new Error("identity.shim.enabled requires identity.legacy");
  return Object.freeze({ current: data.current, legacy: data.legacy, shim: Object.freeze({ enabled: data.shim.enabled }) });
}

/** Read, parse and validate an identity file. */
export function readIdentity(file = DEFAULT_IDENTITY_FILE) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`cannot read identity file ${file}: ${error.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`identity file ${file} is not valid JSON: ${error.message}`);
  }
  return validateIdentity(data);
}

/** Throw unless the identity's current name equals the "name" of the given package.json. */
export function assertMatchesPackageJson(identity, packageJsonFile = join(REPO_ROOT, "package.json")) {
  let name;
  try {
    name = JSON.parse(readFileSync(packageJsonFile, "utf8")).name;
  } catch (error) {
    throw new Error(`cannot read the package name from ${packageJsonFile}: ${error.message}`);
  }
  if (name !== identity.current) {
    throw new Error(`identity.current (${identity.current}) differs from package.json name (${name})`);
  }
  return name;
}

export const identity = readIdentity();
export const packageName = () => identity.current;
export const legacyName = () => identity.legacy;
export const shimEnabled = () => identity.shim.enabled;

function isMain() {
  try {
    return process.argv[1] !== undefined && pathToFileURL(realpathSync(resolve(process.argv[1]))).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isMain()) console.log(packageName());
