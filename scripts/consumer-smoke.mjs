import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const packageName = "@personal-library/react-native-components";
const smokeRoot = "/tmp/plrnui-46-consumer-smoke";
const artifactsDir = join(smokeRoot, "artifacts");
const consumerDir = join(smokeRoot, "consumer");
const npmCache = join(smokeRoot, "npm-cache");

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
  });

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

async function writeConsumerFixture(tarballPath) {
  await mkdir(join(consumerDir, "app"), { recursive: true });
  await mkdir(join(consumerDir, "test"), { recursive: true });

  await writeJson(join(consumerDir, "package.json"), {
    name: "plrnui-46-expo-consumer-smoke",
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      typecheck: "tsc --noEmit",
      "render:smoke":
        "node --import tsx --import ./test/setup.ts --experimental-loader ./test/react-native-loader.mjs --test test/consumer-render.test.tsx",
    },
    dependencies: {
      [packageName]: `file:${tarballPath}`,
      react: "19.2.7",
      "react-native": "0.85.3",
    },
    devDependencies: {
      "@types/node": "26.0.0",
      "@types/react": "19.2.17",
      "@types/react-test-renderer": "19.1.0",
      "react-test-renderer": "19.2.7",
      tsx: "4.22.4",
      typescript: "5.9.3",
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

  await writeFile(
    join(consumerDir, "app.json"),
    `${JSON.stringify(
      {
        expo: {
          name: "PLRNUI 46 Consumer Smoke",
          slug: "plrnui-46-consumer-smoke",
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
  ThemeProvider,
  type ButtonProps,
  type CardProps,
  type InputProps,
  type TextProps,
  type ThemeProviderProps,
} from "${packageName}";

const buttonProps: ButtonProps = {
  label: "Save",
  onPress: () => undefined,
};

const textProps: TextProps = {
  children: "Consumer text",
};

const inputProps: InputProps = {
  value: "Ada",
  onChangeText: () => undefined,
};

const cardProps: CardProps = {
  padding: "md",
};

const providerProps: ThemeProviderProps = {
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

async function validateConsumerInstall() {
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--package-lock=false",
    ],
    { cwd: consumerDir }
  );

  run("npm", ["ls", packageName, "react", "react-native", "--depth=0"], {
    cwd: consumerDir,
  });
  run("npm", ["run", "typecheck"], { cwd: consumerDir });
  run("npm", ["run", "render:smoke"], { cwd: consumerDir });
}

await assertPackageSurface();
await rm(smokeRoot, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
await mkdir(npmCache, { recursive: true });

const tarballPath = await packLibrary();
await writeConsumerFixture(tarballPath);
await validateConsumerInstall();

console.log(`PLRNUI-46 consumer smoke passed using ${tarballPath}`);
