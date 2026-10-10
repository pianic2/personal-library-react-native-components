// Module loader for the legacy-shim compatibility suite (PLRNUI-162, ADR 0013).
// Maps specifiers while the suite runs; fail-closed (a mapping that points to a missing file throws).
//   COMPAT_MODE        shim (default): the legacy specifier resolves to the generated shim (dist-shim); its
//                      `export * from "<target>"` is resolved to the built target (dist).
//                      target: control run, the legacy specifier resolves straight to the built target.
//   COMPAT_LEGACY      legacy specifier (default @legacy-placeholder/shim, the placeholder of scripts/build-shim.mjs)
//   COMPAT_TARGET      target specifier (default: the package name of package.json)
//   COMPAT_SHIM_DIR    directory of the generated shim (default dist-shim); build it with scripts/build-shim.mjs
// `react-native` is mapped to the test shim, like tests/react-native-loader.mjs.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const rnShim = pathToFileURL(join(root, "tests", "shims", "react-native.tsx")).href;
const mode = process.env.COMPAT_MODE ?? "shim";
if (mode !== "shim" && mode !== "target") throw new Error(`COMPAT_MODE must be shim or target (got ${mode})`);
const targetPackage = readManifest(root);
const target = process.env.COMPAT_TARGET ?? targetPackage.name;
const legacy = process.env.COMPAT_LEGACY ?? "@legacy-placeholder/shim";
const shimDir = resolvePath(root, process.env.COMPAT_SHIM_DIR ?? "dist-shim");

// "<name>" -> ".", "<name>/theme" -> "./theme"; undefined when the specifier is not under `name`.
function subpath(specifier, name) {
  if (specifier === name) return ".";
  return specifier.startsWith(`${name}/`) ? `./${specifier.slice(name.length + 1)}` : undefined;
}

function fromExports(manifestDir, manifest, sub, what) {
  const entry = manifest.exports?.[sub];
  const file = typeof entry === "string" ? entry : entry?.import ?? entry?.default;
  if (file === undefined) throw new Error(`compat loader: ${what} has no export "${sub}"`);
  if (typeof file !== "string") throw new Error(`compat loader: ${what} export "${sub}" has no string import/default target`);
  const path = join(manifestDir, file);
  if (!existsSync(path)) throw new Error(`compat loader: ${path} does not exist (${mode === "shim" ? "run npm run build and node scripts/build-shim.mjs" : "run npm run build"})`);
  return pathToFileURL(path).href;
}

function readManifest(dir) {
  const file = join(dir, "package.json");
  if (!existsSync(file)) throw new Error(`compat loader: ${file} does not exist (run npm run build and node scripts/build-shim.mjs)`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`compat loader: ${file} is not valid JSON: ${error.message}`);
  }
}

function mapSpecifier(specifier) {
  if (specifier === "react-native") return rnShim;
  const asTarget = subpath(specifier, target);
  if (asTarget) return fromExports(root, targetPackage, asTarget, `target ${target}`);
  const asLegacy = subpath(specifier, legacy);
  if (asLegacy) {
    return mode === "shim"
      ? fromExports(shimDir, readManifest(shimDir), asLegacy, `shim ${legacy}`)
      : fromExports(root, targetPackage, asLegacy, `target ${target}`);
  }
  return undefined;
}

// Activation sentinel: tests/compat/api.ts resolves it to know the loader is registered. Everything else is fatal then.
export const ACTIVE = "compat-loader:active";

export function resolve(specifier, context, nextResolve) {
  if (specifier === ACTIVE) return { shortCircuit: true, url: "data:text/javascript,export default true" };
  const url = mapSpecifier(specifier);
  return url ? { shortCircuit: true, url } : nextResolve(specifier, context);
}
