import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const packageName = "@personal-library/react-native-components";
const smokeRoot = "/tmp/plrnui-58-expo-consumer";
const artifactsDir = join(smokeRoot, "artifacts");
const consumerDir = join(smokeRoot, "consumer");
const npmCache = join(smokeRoot, "npm-cache");

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
    name: "plrnui-58-expo-metro-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      typecheck: "tsc --noEmit",
      "expo:export": "expo export --platform web --output-dir dist-web",
    },
    dependencies: {
      [packageName]: `file:${tarballPath}`,
      expo: "~56.0.12",
      react: "19.2.7",
      "react-dom": "19.2.7",
      "react-native": "0.85.3",
      "react-native-web": "^0.21.0",
    },
    devDependencies: {
      "@types/node": "26.0.0",
      "@types/react": "19.2.17",
      typescript: "5.9.3",
    },
  });

  await writeJson(join(consumerDir, "app.json"), {
    expo: {
      name: "PLRNUI 58 Expo Metro Consumer",
      slug: "plrnui-58-expo-metro-consumer",
      platforms: ["web"],
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

const providerInitialMode: ThemeProviderProps["initialMode"] = "light";

const textProps: TextProps = {
  children: "Expo Metro text",
};

const inputProps: InputProps = {
  label: "Name",
  value: "Ada",
  onChangeText: () => undefined,
};

const buttonProps: ButtonProps = {
  label: "Save",
  onPress: () => undefined,
};

const cardProps: CardProps = {
  padding: "md",
};

export default function App() {
  return (
    <ThemeProvider initialMode={providerInitialMode}>
      <Box padding="md">
        <Text {...textProps} />
        <Input {...inputProps} />
        <Card {...cardProps}>
          <Text>Card body</Text>
          <Button {...buttonProps} />
        </Card>
      </Box>
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
      "--package-lock=false",
    ],
    { cwd: consumerDir }
  );

  run("npm", ["ls", packageName, "expo", "react", "react-native", "--depth=0"], {
    cwd: consumerDir,
  });
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

console.log(`PLRNUI-58 Expo/Metro consumer smoke passed using ${tarballPath}`);
