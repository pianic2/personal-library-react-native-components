import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { packageName as currentPackageName } from "./lib/identity.mjs";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
// The package name comes from the single-source identity (config/package-identity.json); today it is
// @personal-library/react-native-components, and assertPackageSurface checks that package.json agrees.
const packageName = currentPackageName();
// --via-shim (PLRNUI-170): also pack the generated legacy shim, install both tarballs and import from the legacy name.
const viaShim = process.argv.slice(2).includes("--via-shim");
for (const arg of process.argv.slice(2)) {
  if (arg !== "--via-shim") {
    console.error(`unknown argument: ${arg} (usage: node scripts/consumer-smoke.mjs [--via-shim])`);
    process.exit(2);
  }
}
let shimName = "";
let shimTarball = "";
const smokeRoot = "/tmp/plrnui-64-consumer-smoke";
const artifactsDir = join(smokeRoot, "artifacts");
const consumerDir = join(smokeRoot, "consumer");
const npmCache = "/tmp/plrnui-consumer-npm-cache";
const installTimeoutMs = 7 * 60 * 1000;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: {
      ...process.env,
      npm_config_cache: npmCache,
      ...(options.env ?? {}),
    },
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    timeout: options.timeout ?? undefined,
  });

  if (result.error?.code === "ETIMEDOUT") {
    throw new Error(
      `Command timed out after ${Math.round((options.timeout ?? 0) / 1000)}s: ${[
        command,
        ...args,
      ].join(" ")}`
    );
  }

  if (result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    const details = options.capture
      ? `\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
      : "";
    throw new Error(`Command failed (${result.status}): ${rendered}${details}`);
  }

  return result;
}

async function writeJson(path, value) {
  await writeFile(`${path}`, `${JSON.stringify(value, null, 2)}\n`);
}

let packageVersion = "";

const tsconfigMatrix = [
  { name: "nodenext", compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext" } },
  { name: "node16", compilerOptions: { module: "Node16", moduleResolution: "Node16" } },
  { name: "bundler", compilerOptions: { module: "ESNext", moduleResolution: "Bundler" } },
  { name: "bundler-isolated", compilerOptions: { module: "ESNext", moduleResolution: "Bundler", isolatedModules: true } },
];

async function assertPackageSurface() {
  const packageJson = JSON.parse(
    await readFile(join(repoRoot, "package.json"), "utf8")
  );

  if (packageJson.name !== packageName) {
    throw new Error(`Unexpected package name: ${packageJson.name}`);
  }

  if (packageJson.main !== "./dist/index.js") {
    throw new Error(`Unexpected main entrypoint: ${packageJson.main}`);
  }

  if (packageJson.types !== "./dist/index.d.ts") {
    throw new Error(`Unexpected types entrypoint: ${packageJson.types}`);
  }

  if (!packageJson.exports?.["."]?.import || !packageJson.exports?.["."]?.types) {
    throw new Error("Root package export must expose import and types entries");
  }

  if (packageJson.peerDependencies?.["react-native"] !== ">=0.86.0 <0.87.0") {
    throw new Error(
      `PLRNUI-64 requires RN 0.86 peer support; found ${
        packageJson.peerDependencies?.["react-native"]
      }`
    );
  }

  packageVersion = packageJson.version;
}

async function packLibrary() {
  run("npm", ["run", "build"]);
  run("npm", ["pack", "--pack-destination", artifactsDir]);

  const filename = `${packageName
    .replace(/^@/, "")
    .replace(/\//g, "-")}-${packageVersion}.tgz`;
  const tarballPath = join(artifactsDir, filename);

  if (!existsSync(tarballPath)) {
    throw new Error(`Packed artifact was not created: ${tarballPath}`);
  }

  const tarList = run("tar", ["-tzf", tarballPath], { capture: true });
  const files = tarList.stdout
    .trim()
    .split(/\r?\n/)
    .map((file) => file.replace(/^package\//, ""));
  const forbiddenFiles = files.filter(
    (file) => file === "src" || file.startsWith("src/")
  );

  if (forbiddenFiles.length > 0) {
    throw new Error(
      `Packed artifact unexpectedly contains source files: ${forbiddenFiles.join(", ")}`
    );
  }

  return tarballPath;
}

// Builds the shim from the packed target tarball (names and version come from the identity config and the tarball)
// and packs it. Returns the shim tarball path and records the shim package name.
async function packShim(targetTarball) {
  const shimDir = join(smokeRoot, "shim");
  run("node", ["scripts/build-shim.mjs", "--out", shimDir, "--target-tarball", targetTarball]);
  const shimPackage = JSON.parse(readFileSync(join(shimDir, "package.json"), "utf8"));
  shimName = shimPackage.name;
  run("npm", ["pack", "--pack-destination", artifactsDir], { cwd: shimDir });
  const tarball = join(artifactsDir, `${shimName.replace(/^@/, "").replace(/\//g, "-")}-${shimPackage.version}.tgz`);
  if (!existsSync(tarball)) throw new Error(`Packed shim was not created: ${tarball}`);
  return tarball;
}

// Every physical copy of `name` below node_modules (including nested ones) of the consumer.
function installedCopies(dir, name) {
  const found = [];
  const visit = (nodeModules) => {
    if (!existsSync(nodeModules)) return;
    for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const entries = entry.name.startsWith("@") ? readdirSync(join(nodeModules, entry.name)).map((n) => `${entry.name}/${n}`) : [entry.name];
      for (const rel of entries) {
        const pkgDir = join(nodeModules, rel);
        if (rel === name && existsSync(join(pkgDir, "package.json"))) found.push(pkgDir);
        visit(join(pkgDir, "node_modules"));
      }
    }
  };
  visit(join(dir, "node_modules"));
  return found;
}

// Asserts one resolved copy (one version, one install location) of each name in `npm ls --all`.
function assertSingleCopies(names) {
  const listing = run("npm", ["ls", "--all", "--json", "--long", ...names], { cwd: consumerDir, capture: true });
  const copies = new Map(names.map((n) => [n, new Set()]));
  const versions = new Map(names.map((n) => [n, new Set()]));
  const walk = (deps) => {
    for (const [dep, node] of Object.entries(deps ?? {})) {
      if (copies.has(dep)) {
        copies.get(dep).add(node.path ?? `${node.version}:${node.resolved}`);
        versions.get(dep).add(node.version);
      }
      walk(node.dependencies);
    }
  };
  walk(JSON.parse(listing.stdout).dependencies);
  for (const name of names) {
    if (versions.get(name).size !== 1) throw new Error(`npm ls --all: expected one version of ${name}, found ${[...versions.get(name)].join(", ") || "none"}`);
    const installed = installedCopies(consumerDir, name);
    if (installed.length !== 1) throw new Error(`expected one installed copy of ${name}, found ${installed.length}: ${installed.join(", ")}`);
  }
  console.log(`single copy of ${names.join(", ")} (versions ${names.map((n) => [...versions.get(n)][0]).join(", ")})`);
}

async function writeConsumerFixture(tarballPath) {
  // In shim mode the app imports from the legacy name, except ThemeProvider and useTheme, which come from the target
  // name (mixed imports, R1 M4): both names must resolve to one module instance and one theme context.
  const importName = viaShim ? shimName : packageName;
  const renderScript = viaShim ? "test/consumer-render.test.tsx test/mixed-imports.test.tsx" : "test/consumer-render.test.tsx";

  await mkdir(join(consumerDir, "app"), { recursive: true });
  await mkdir(join(consumerDir, "test"), { recursive: true });

  await writeJson(join(consumerDir, "package.json"), {
    name: "plrnui-64-consumer-smoke",
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      typecheck: "tsc --noEmit",
      "typecheck:matrix": tsconfigMatrix.map((v) => `tsc -p tsconfig.${v.name}.json`).join(" && "),
      "render:smoke":
        `node --import tsx --import ./test/setup.ts --experimental-loader ./test/react-native-loader.mjs --test ${renderScript}`,
    },
    dependencies: {
      [packageName]: `file:${tarballPath}`,
      ...(viaShim ? { [shimName]: `file:${shimTarball}` } : {}),
      react: "19.2.3",
      "react-native": "0.86.3",
    },
    // The shim depends on ^<major>.0.0 of the target, which a 0.x tarball does not satisfy; the override pins the
    // shim's dependency to the tarball installed above, so only one copy of the target exists.
    ...(viaShim ? { overrides: { [packageName]: `$${packageName}` } } : {}),
    devDependencies: {
      "@types/node": "26.0.0",
      "@types/react": "19.2.17",
      "@types/react-test-renderer": "19.1.0",
      "react-test-renderer": "19.2.3",
      tsx: "4.22.4",
      typescript: "6.0.3",
    },
  });

  await writeJson(join(consumerDir, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
      types: ["node", "react"],
    },
    include: ["app/**/*.tsx", "test/**/*.tsx"],
  });

  // Strict matrix (PLRNUI-232): the packed declarations must compile with skipLibCheck false under every module
  // resolution a consumer may use. `tsconfig.json` above stays the default NodeNext check; each variant below is a
  // standalone config compiled by `typecheck:matrix`.
  for (const variant of tsconfigMatrix) {
    await writeJson(join(consumerDir, `tsconfig.${variant.name}.json`), {
      compilerOptions: {
        target: "ES2022",
        jsx: "react-jsx",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: false,
        noEmit: true,
        // react-native's own globals.d.ts conflicts with lib.dom and @types/node under skipLibCheck false, which is not
        // a defect of the packed declarations; the app needs neither, so the matrix compiles without them.
        lib: ["ES2022"],
        types: ["react"],
        ...variant.compilerOptions,
      },
      include: ["app/**/*.tsx"],
    });
  }

  await writeFile(
    join(consumerDir, "app.json"),
    `${JSON.stringify(
      {
        expo: {
          name: "PLRNUI 64 Consumer Smoke",
          slug: "plrnui-64-consumer-smoke",
        },
      },
      null,
      2
    )}\n`
  );

  await writeFile(
    join(consumerDir, "app", "App.tsx"),
    `import React from "react";
import {
  Box,
  Button,
  Card,
  Input,
  Text,
  ${viaShim ? "" : "ThemeProvider,\n  "}type ButtonProps,
  type CardProps,
  type InputProps,
  type TextProps,
  ${viaShim ? "" : "type ThemeProviderProps,\n"}} from "${importName}";
${viaShim ? `import { ThemeProvider, type ThemeProviderProps } from "${packageName}";\n` : ""}
const buttonProps: ButtonProps = {
  label: "Save",
  onPress: () => undefined,
};

const textProps: TextProps = {
  children: "Consumer text",
};

const inputProps: InputProps = {
  label: "Name",
  value: "Ada",
  onChangeText: () => undefined,
};

const cardProps: CardProps = {
  padding: "md",
};

const providerProps: Omit<ThemeProviderProps, "children"> = {
  initialMode: "light",
};

export function ConsumerSmokeApp() {
  return (
    <ThemeProvider {...providerProps}>
      <Box padding="sm">
        <Text {...textProps} />
        <Input {...inputProps} />
        <Card {...cardProps}>
          <Button {...buttonProps} />
        </Card>
      </Box>
    </ThemeProvider>
  );
}
`
  );

  await writeFile(
    join(consumerDir, "test", "setup.ts"),
    `Object.defineProperty(globalThis, "__DEV__", {
  configurable: true,
  value: false,
  writable: true,
});

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});
`
  );

  await writeFile(
    join(consumerDir, "test", "react-native-shim.tsx"),
    `import React from "react";

type HostProps = Record<string, unknown> & {
  children?: React.ReactNode;
};

function createHostComponent(name: string) {
  return React.forwardRef<unknown, HostProps>(function HostComponent(
    { children, ...props },
    ref
  ) {
    return React.createElement(name, { ...props, ref }, children as React.ReactNode);
  });
}

export const View = createHostComponent("View");
export const ScrollView = createHostComponent("ScrollView");
export const Pressable = createHostComponent("Pressable");
export const Modal = createHostComponent("Modal");
export const Text = createHostComponent("Text");
export const TextInput = createHostComponent("TextInput");
export const ActivityIndicator = createHostComponent("ActivityIndicator");

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
  flatten<T>(style: T): T {
    return style;
  },
};

export const Platform = {
  OS: "test",
  select<T>(options: Record<string, T>): T | undefined {
    return options.test ?? options.default;
  },
};

export const Linking = {
  async openURL(_url: string): Promise<void> {
    return undefined;
  },
};

export function useWindowDimensions() {
  return {
    fontScale: 1,
    height: 800,
    scale: 1,
    width: 1280,
  };
}
`
  );

  await writeFile(
    join(consumerDir, "test", "react-native-loader.mjs"),
    `import { pathToFileURL } from "node:url";

const reactNativeShimUrl = pathToFileURL(
  new URL("./react-native-shim.tsx", import.meta.url).pathname
).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "react-native") {
    return {
      shortCircuit: true,
      url: reactNativeShimUrl,
    };
  }

  return nextResolve(specifier, context);
}
`
  );

  await writeFile(
    join(consumerDir, "test", "consumer-render.test.tsx"),
    `import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import * as RootApi from "${packageName}";
import { ConsumerSmokeApp } from "../app/App.js";

describe("packed package consumer smoke", () => {
  it("resolves representative root API exports", () => {
    for (const symbol of [
      "ThemeProvider",
      "Button",
      "Text",
      "Box",
      "Input",
      "Card",
    ]) {
      assert.equal(typeof RootApi[symbol as keyof typeof RootApi], "function");
    }

    assert.equal("auraTokens" in RootApi, false);
    assert.equal("getAuraTokens" in RootApi, false);
  });

  it("renders representative components inside ThemeProvider", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(<ConsumerSmokeApp />);
    });

    assert.ok(renderer?.toJSON());
  });
});
`
  );
}

async function writeMixedImportsTest() {
  await writeFile(
    join(consumerDir, "test", "mixed-imports.test.tsx"),
    `import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import * as Target from "${packageName}";
import * as Legacy from "${shimName}";
import { ThemeProvider } from "${packageName}";
import { Button, Text, useTheme } from "${shimName}";

function Probe() {
  const { mode } = useTheme();
  return <Text>{"mode:" + mode}</Text>;
}

describe("shim mixed imports", () => {
  it("re-exports the same instances as the target name", () => {
    for (const symbol of ["ThemeProvider", "Button", "Text", "Box", "Input", "Card", "useTheme"]) {
      assert.equal(Legacy[symbol as keyof typeof Legacy], Target[symbol as keyof typeof Target], symbol);
    }
  });

  it("renders a legacy-name Button with the theme of a target-name ThemeProvider", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <Probe />
          <Button label="Save" onPress={() => undefined} />
        </ThemeProvider>
      );
    });
    const json = JSON.stringify(renderer?.toJSON());
    assert.ok(json.includes("mode:dark"), "the legacy-name useTheme must see the target-name ThemeProvider");
    assert.ok(json.includes("Save"), "the legacy-name Button must render inside it");
  });
});
`
  );
}

async function validateConsumerInstall() {
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--package-lock=false",
      "--prefer-offline",
    ],
    { cwd: consumerDir, timeout: installTimeoutMs }
  );

  run("npm", ["ls", packageName, ...(viaShim ? [shimName] : []), "react", "react-native", "--depth=0"], {
    cwd: consumerDir,
  });
  if (viaShim) assertSingleCopies([packageName, "react", "react-native"]);
  run("npm", ["run", "typecheck"], { cwd: consumerDir });
  run("npm", ["run", "typecheck:matrix"], { cwd: consumerDir });
  run("npm", ["run", "render:smoke"], { cwd: consumerDir });
}

await assertPackageSurface();
await rm(smokeRoot, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
await mkdir(npmCache, { recursive: true });

const tarballPath = await packLibrary();
if (viaShim) shimTarball = await packShim(tarballPath);
await writeConsumerFixture(tarballPath);
if (viaShim) await writeMixedImportsTest();
await validateConsumerInstall();

console.log(`PLRNUI-64 consumer smoke passed${viaShim ? ` via shim ${shimName}` : ""} using ${tarballPath}`);
