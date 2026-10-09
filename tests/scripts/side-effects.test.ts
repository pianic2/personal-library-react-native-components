import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// PLRNUI-212: importing any module of src/ must not touch the react-native runtime (Appearance, Dimensions,
// Linking, listeners, ...). Every module is imported in a child process whose "react-native" is a recording shim.
// Report and the sideEffects recommendation: audit/texo-v1/spikes/E14-side-effects.md.

const root = resolve(import.meta.dirname, "../..");

// Import-time uses of react-native that are known and harmless (pure construction or a plain constant read).
// Everything else recorded at import time fails the test. Keep in sync with the report.
const ALLOWED = new Set([
  "src/components/Card/Card.tsx|StyleSheet.create",
  "src/components/FormField/FormField.tsx|StyleSheet.create",
  "src/utils/platform.ts|Platform.OS (read)",
]);

const SHIM = `
const records = (globalThis.__rnRecords = []);
function record(api, kind) {
  const frames = (new Error().stack ?? "").split("\\n").slice(2);
  const frame = frames
    .map((line) => /((?:file:\\/\\/)?\\/[^\\s():]+\\.m?[tj]sx?)(?::\\d+){0,2}\\)?\\s*$/.exec(line)?.[1])
    .find((file) => file && !file.includes("rn-recording-shim"));
  records.push({ api, kind, file: (frame ?? "unknown").replace(/^file:\\/\\//, "") });
}
function fn(api, impl) {
  return (...args) => {
    record(api, "call");
    return impl ? impl(...args) : undefined;
  };
}
function watched(name, target) {
  return new Proxy(target, {
    get(object, key) {
      const value = object[key];
      if (typeof value === "function") return fn(name + "." + String(key), value);
      record(name + "." + String(key) + " (read)", "read");
      return value;
    },
  });
}
const component = (name) => function Component(props) { return props?.children ?? null; };
export const View = component("View");
export const Text = component("Text");
export const TextInput = component("TextInput");
export const ScrollView = component("ScrollView");
export const Pressable = component("Pressable");
export const ActivityIndicator = component("ActivityIndicator");
export const Modal = component("Modal");
export const Image = component("Image");
export const FlatList = component("FlatList");
export const SafeAreaView = component("SafeAreaView");
export const StyleSheet = { create: fn("StyleSheet.create", (styles) => styles), flatten: fn("StyleSheet.flatten", (style) => style), hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {} };
export const Platform = watched("Platform", { OS: "ios", Version: "17", select: (spec) => spec.ios ?? spec.default });
export const Appearance = watched("Appearance", { getColorScheme: () => "light", addChangeListener: () => ({ remove() {} }) });
export const Dimensions = watched("Dimensions", { get: () => ({ width: 800, height: 600, scale: 1, fontScale: 1 }), addEventListener: () => ({ remove() {} }) });
export const Linking = watched("Linking", { openURL: async () => undefined, addEventListener: () => ({ remove() {} }) });
export const Keyboard = watched("Keyboard", { addListener: () => ({ remove() {} }), dismiss: () => undefined });
export const PixelRatio = watched("PixelRatio", { get: () => 1, getFontScale: () => 1 });
export const I18nManager = watched("I18nManager", { isRTL: false });
export const AccessibilityInfo = watched("AccessibilityInfo", { isScreenReaderEnabled: async () => false, addEventListener: () => ({ remove() {} }) });
export const LayoutAnimation = watched("LayoutAnimation", { configureNext: () => undefined, Presets: {} });
export const PanResponder = watched("PanResponder", { create: () => ({ panHandlers: {} }) });
export const Animated = watched("Animated", { Value: class {}, timing: () => ({ start() {} }), View: component("Animated.View") });
export const useWindowDimensions = fn("useWindowDimensions", () => ({ width: 800, height: 600, scale: 1, fontScale: 1 }));
export const useColorScheme = fn("useColorScheme", () => "light");
`;

const RUNNER = `
import { pathToFileURL } from "node:url";
const files = JSON.parse(process.argv[2]);
const failures = [];
for (const file of files) {
  try {
    await import(pathToFileURL(file).href);
  } catch (error) {
    failures.push(file + ": " + (error?.message ?? error));
  }
}
console.log(JSON.stringify({ records: globalThis.__rnRecords ?? [], failures }));
`;

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) found.push(full);
  }
  return found;
}

type Record = { api: string; kind: string; file: string };

/** Import `files` in a child process with the recording react-native shim and return what happened at import time. */
function importRecording(files: string[]): { records: Record[]; failures: string[] } {
  const dir = mkdtempSync(join(tmpdir(), "side-effects-"));
  try {
    const shimPath = join(dir, "rn-recording-shim.mjs");
    writeFileSync(shimPath, SHIM);
    const hook = `export function resolve(specifier, context, nextResolve) { if (specifier === "react-native") return { shortCircuit: true, url: ${JSON.stringify(pathToFileURL(shimPath).href)} }; return nextResolve(specifier, context); }`;
    const registerPath = join(dir, "register.mjs");
    writeFileSync(registerPath, `import { register } from "node:module"; register("data:text/javascript," + encodeURIComponent(${JSON.stringify(hook)}));`);
    const runnerPath = join(dir, "runner.mjs");
    writeFileSync(runnerPath, RUNNER);
    const result = spawnSync(process.execPath, ["--import", "tsx", "--import", pathToFileURL(registerPath).href, runnerPath, JSON.stringify(files)], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `child process failed: ${result.stderr}`);
    return JSON.parse(result.stdout.trim().split("\n").pop() as string);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function relativeFile(file: string): string {
  return file.startsWith(root) ? relative(root, file).split(sep).join("/") : file;
}

/** "relative/file|api" keys of records that are not in the allow-list. */
function unexpected(records: Record[]): string[] {
  return [...new Set(records.map((r) => `${relativeFile(r.file)}|${r.api}`))].filter((key) => !ALLOWED.has(key)).sort();
}

describe("PLRNUI-212 import-time side effects", () => {
  it("no module of src/ touches react-native at import time beyond the allow-list", () => {
    const files = sourceFiles(join(root, "src"));
    assert.ok(files.length > 80, "expected to import every module of src/");
    const { records, failures } = importRecording(files);
    assert.deepEqual(failures, [], "every module must import with the recording shim");
    assert.deepEqual(unexpected(records), []);
  });

  it("the allow-list is not stale: every allowed import-time use still happens", () => {
    const { records } = importRecording(sourceFiles(join(root, "src")));
    const seen = new Set(records.map((r) => `${relativeFile(r.file)}|${r.api}`));
    assert.deepEqual([...ALLOWED].filter((key) => !seen.has(key)).sort(), []);
  });

  it("fails when a module-scope Appearance/Dimensions/Platform call is added (control)", () => {
    const dir = mkdtempSync(join(tmpdir(), "side-effects-fixture-"));
    try {
      const bad = join(dir, "bad.mts");
      writeFileSync(
        bad,
        'import { Appearance, Dimensions, Platform, Linking } from "react-native";\nexport const scheme = Appearance.getColorScheme();\nexport const size = Dimensions.get("window");\nexport const label = Platform.select({ ios: "i", default: "d" });\nAppearance.addChangeListener(() => undefined);\nvoid Linking;\n',
      );
      const { records, failures } = importRecording([bad]);
      assert.deepEqual(failures, []);
      const apis = unexpected(records).map((key) => key.split("|")[1]);
      for (const expected of ["Appearance.getColorScheme", "Dimensions.get", "Platform.select", "Appearance.addChangeListener"]) {
        assert.ok(apis.includes(expected), `${expected} must be reported`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a clean module produces no records (control)", () => {
    const dir = mkdtempSync(join(tmpdir(), "side-effects-fixture-"));
    try {
      const good = join(dir, "good.mts");
      writeFileSync(good, 'import { View } from "react-native";\nexport const Box = View;\nexport function later() { return 1; }\n');
      const { records, failures } = importRecording([good]);
      assert.deepEqual(failures, []);
      assert.deepEqual(records, []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
