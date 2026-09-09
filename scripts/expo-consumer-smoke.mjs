import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const packageName = "@personal-library/react-native-components";
const smokeRoot = "/tmp/plrnui-64-expo-consumer";
const artifactsDir = join(smokeRoot, "artifacts");
const consumerDir = join(smokeRoot, "consumer");
const npmCache = "/tmp/plrnui-expo57-npm-cache";
const installTimeoutMs = 7 * 60 * 1000;

let packageVersion = "";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: {
      ...process.env,
      CI: "1",
      EXPO_NO_TELEMETRY: "1",
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
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

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
      `Expo 57 RC baseline requires React Native 0.86 peer support; found ${
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

async function writeConsumerFixture(tarballPath) {
  await writeJson(join(consumerDir, "package.json"), {
    name: "plrnui-64-expo-57-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      typecheck: "tsc --noEmit",
      "expo:export": "expo export --platform web --output-dir dist-web",
    },
    dependencies: {
      [packageName]: `file:${tarballPath}`,
      expo: "57.0.21",
      react: "19.2.3",
      "react-dom": "19.2.3",
      "react-native": "0.86.3",
      "react-native-web": "0.21.2",
    },
    devDependencies: {
      "@types/node": "26.0.0",
      "@types/react": "19.2.17",
      typescript: "6.0.3",
    },
  });

  await writeJson(join(consumerDir, "app.json"), {
    expo: {
      name: "PLRNUI 64 Expo 57 Consumer",
      slug: "plrnui-64-expo-57-consumer",
      platforms: ["android", "ios", "web"],
      web: {
        bundler: "metro",
      },
    },
  });

  await writeJson(join(consumerDir, "tsconfig.json"), {
    extends: "expo/tsconfig.base",
    compilerOptions: {
      strict: true,
      noEmit: true,
      types: ["node", "react"],
    },
    include: ["App.tsx"],
  });

  await writeFile(
    join(consumerDir, "index.js"),
    `import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
`
  );

  await writeFile(
    join(consumerDir, "App.tsx"),
    `import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Input,
  Text,
  ThemeProvider,
  useTheme,
} from "${packageName}";

function Probe() {
  const [value, setValue] = useState("Ada");
  const [count, setCount] = useState(0);
  const { mode, toggleTheme } = useTheme();

  return (
    <Box padding="md">
      <Card padding="md">
        <Text>{"Mode: " + mode + "; count: " + count + "; input: " + value}</Text>
        <Input label="Name" value={value} onChangeText={setValue} />
        <Button label="Increment" onPress={() => setCount((n) => n + 1)} />
        <Button label="Toggle theme" onPress={toggleTheme} />
      </Card>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider initialMode="light">
      <Probe />
    </ThemeProvider>
  );
}
`
  );
}

async function validateConsumer(tarballPath) {
  await writeConsumerFixture(tarballPath);

  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--prefer-offline",
    ],
    { cwd: consumerDir, timeout: installTimeoutMs }
  );

  run(
    "npm",
    ["ls", packageName, "expo", "react", "react-dom", "react-native", "--depth=0"],
    { cwd: consumerDir }
  );
  run("npm", ["run", "typecheck"], { cwd: consumerDir });
  run("npx", ["expo", "export", "--platform", "web", "--output-dir", "dist-web"], {
    cwd: consumerDir,
  });
}

await assertPackageSurface();
await rm(smokeRoot, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
await mkdir(consumerDir, { recursive: true });
await mkdir(npmCache, { recursive: true });

const tarballPath = await packLibrary();
await validateConsumer(tarballPath);

console.log(`PLRNUI-64 Expo 57 consumer smoke passed using ${tarballPath}`);
