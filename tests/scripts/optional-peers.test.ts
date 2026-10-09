import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// PLRNUI-310 / ADR 0010: the root entry must import with every optional peer absent.
// A resolve hook makes the optional peers unresolvable (as if not installed), then the package root is imported.

const root = resolve(import.meta.dirname, "../..");
const BLOCKED = [
  "expo",
  "expo-clipboard",
  "expo-haptics",
  "expo-constants",
  "expo-linking",
  "expo-router",
  "expo-secure-store",
  "expo-status-bar",
  "react-native-svg",
  "@shopify/flash-list",
  "react-native-safe-area-context",
  "@react-native-community/datetimepicker",
];

function runWithBlocked(blocked: string[], file: string) {
  const dir = mkdtempSync(join(tmpdir(), "optional-peers-"));
  try {
    const rnShim = pathToFileURL(join(root, "tests/shims/react-native.tsx")).href;
    const hook = `
const BLOCKED = ${JSON.stringify(blocked)};
export function resolve(specifier, context, nextResolve) {
  if (BLOCKED.some((name) => specifier === name || specifier.startsWith(name + "/") || (name === "expo" && specifier.startsWith("expo-")))) {
    const error = new Error("Cannot find package '" + specifier + "' (blocked by the optional-peers test)");
    error.code = "ERR_MODULE_NOT_FOUND";
    throw error;
  }
  if (specifier === "react-native") return nextResolve(${JSON.stringify(rnShim)}, context);
  return nextResolve(specifier, context);
}`;
    const registerPath = join(dir, "register.mjs");
    writeFileSync(registerPath, `import { register } from "node:module"; register("data:text/javascript," + encodeURIComponent(${JSON.stringify(hook)}));`);
    const runnerPath = join(dir, "runner.mjs");
    writeFileSync(runnerPath, `import { pathToFileURL } from "node:url"; const mod = await import(pathToFileURL(process.argv[2]).href); console.log(JSON.stringify({ exports: Object.keys(mod).length }));`);
    return spawnSync(process.execPath, ["--import", "tsx", "--import", pathToFileURL(registerPath).href, runnerPath, file], { cwd: root, encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(name)) found.push(full);
  }
  return found;
}

describe("PLRNUI-310 optional peers", () => {
  it("importing the package root succeeds with expo-* modules and the four optional libraries blocked", () => {
    const result = runWithBlocked(BLOCKED, join(root, "src/index.ts"));
    assert.equal(result.status, 0, result.stderr);
    assert.ok(JSON.parse(result.stdout.trim().split("\n").pop() as string).exports > 50);
  });

  it("positive control: a module that imports a blocked peer does fail under the hook", () => {
    const dir = mkdtempSync(join(tmpdir(), "optional-peers-probe-"));
    try {
      for (const name of BLOCKED) {
        const probe = join(dir, "probe.mjs");
        writeFileSync(probe, `import ${JSON.stringify(name)};\n`);
        const result = runWithBlocked(BLOCKED, probe);
        assert.notEqual(result.status, 0, `${name} should be blocked`);
        assert.match(result.stderr, /blocked by the optional-peers test/, name);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the same probe resolves when the peer is not blocked (the hook only blocks what it is told to)", () => {
    const dir = mkdtempSync(join(tmpdir(), "optional-peers-probe-"));
    try {
      const probe = join(dir, "probe.mjs");
      writeFileSync(probe, `import "node:path";\n`);
      assert.equal(runWithBlocked(BLOCKED, probe).status, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("src has no require() call and no static import of an optional peer (injection is the only core mechanism)", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(join(root, "src"))) {
      const text = readFileSync(file, "utf8");
      const rel = relative(root, file).split(sep).join("/");
      if (/(^|[^\w.])require\s*\(/.test(text)) offenders.push(`${rel}: require()`);
      for (const name of BLOCKED) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
        if (new RegExp(`(from|import)\\s*\\(?\\s*["']${escaped}(/[^"']*)?["']`).test(text)) offenders.push(`${rel}: ${name}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it("package.json declares only react and react-native as peers and no runtime dependencies today", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    assert.deepEqual(Object.keys(pkg.peerDependencies).sort(), ["react", "react-native"]);
    assert.ok(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0);
  });
});
