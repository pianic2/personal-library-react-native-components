// Expo consumer smoke (PLRNUI-64, extended by PLRNUI-119): packs the library, installs the tarball into an Expo 57
// consumer and exports it for web, iOS and Android (Hermes bundles).
//   node scripts/expo-consumer-smoke.mjs [--platform web|ios|android|all] [--work-dir <dir>]
// Default platform: all. Default work dir: <os.tmpdir()>/plrnui-64-expo-consumer. Exit 0 ok, 1 a step failed, 2 usage.
import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const packageName = "@personal-library/react-native-components";
const PLATFORMS = ["web", "ios", "android"];
const installTimeoutMs = 7 * 60 * 1000;
// Markers rendered by the consumer app; they must appear in every exported bundle.
const APP_MARKERS = ["Increment", "Toggle theme"];

let smokeRoot = "";
let artifactsDir = "";
let consumerDir = "";
let npmCache = "";

export function defaultWorkDir() {
  return join(tmpdir(), "plrnui-64-expo-consumer");
}

export function parseArgs(argv) {
  const opts = { platforms: PLATFORMS, workDir: defaultWorkDir() };
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1];
    if (argv[i] === "--platform" && value !== undefined) {
      if (value === "all") opts.platforms = PLATFORMS;
      else if (PLATFORMS.includes(value)) opts.platforms = [value];
      else throw new UsageError(`--platform must be one of ${PLATFORMS.join(", ")}, all`);
    } else if (argv[i] === "--work-dir" && value !== undefined && !value.startsWith("--")) {
      opts.workDir = resolve(value);
    } else {
      throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
    }
  }
  return opts;
}

export class UsageError extends Error {}

function listFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...listFiles(full));
    else found.push(full);
  }
  return found;
}

/** Asserts that an export directory holds a non-empty bundle for the platform and returns its path and size. */
export function assertBundle(outputDir, platform) {
  if (!existsSync(outputDir)) throw new Error(`${platform}: export directory missing: ${outputDir}`);
  const files = listFiles(outputDir);
  const extensions = platform === "web" ? [".js"] : [".hbc"];
  const bundles = files.filter((file) => extensions.includes(extname(file)) && statSync(file).size > 0);
  if (bundles.length === 0) throw new Error(`${platform}: no non-empty ${extensions.join("/")} bundle in ${outputDir}`);
  const bundle = bundles.sort((a, b) => statSync(b).size - statSync(a).size)[0];
  return { bundle, bytes: statSync(bundle).size };
}

/** Serves the exported web build on an ephemeral local port and checks that the HTML and its script load. */
export async function assertWebRender(outputDir) {
  const html = await readFile(join(outputDir, "index.html"), "utf8");
  const scriptSrc = /<script[^>]+src="([^"]+\.js)"/.exec(html)?.[1];
  if (!scriptSrc) throw new Error("web: index.html references no script bundle");
  if (!/id="root"/.test(html)) throw new Error('web: index.html has no element with id="root"');
  const server = createServer(async (request, response) => {
    try {
      const path = join(outputDir, decodeURIComponent((request.url ?? "/").split("?")[0]));
      const inside = relative(outputDir, path);
      if (inside.startsWith("..") || resolve(inside) === inside) throw new Error("outside the export directory");
      const body = await readFile(path.endsWith("/") ? join(path, "index.html") : path);
      response.writeHead(200).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${base}/`);
    if (page.status !== 200) throw new Error(`web: GET / returned ${page.status}`);
    const script = await fetch(new URL(scriptSrc, `${base}/`));
    if (script.status !== 200) throw new Error(`web: GET ${scriptSrc} returned ${script.status}`);
    const code = await script.text();
    for (const marker of APP_MARKERS) {
      if (!code.includes(marker)) throw new Error(`web: exported script does not contain the app marker "${marker}"`);
    }
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

async function assertNativeMarkers(bundle, platform) {
  const code = await readFile(bundle, "latin1");
  for (const marker of APP_MARKERS) {
    if (!code.includes(marker)) throw new Error(`${platform}: Hermes bundle does not contain the app marker "${marker}"`);
  }
}

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

async function validateConsumer(tarballPath, platforms) {
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
  for (const platform of platforms) {
    const outputDir = `dist-${platform}`;
    run("npx", ["expo", "export", "--platform", platform, "--output-dir", outputDir], { cwd: consumerDir });
    const { bundle, bytes } = assertBundle(join(consumerDir, outputDir), platform);
    if (platform === "web") await assertWebRender(join(consumerDir, outputDir));
    else await assertNativeMarkers(bundle, platform);
    console.log(`${platform}: bundle ${bundle.replace(consumerDir + "/", "")} ${bytes} bytes`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  smokeRoot = opts.workDir;
  artifactsDir = join(smokeRoot, "artifacts");
  consumerDir = join(smokeRoot, "consumer");
  npmCache = join(tmpdir(), "plrnui-expo57-npm-cache");

  await assertPackageSurface();
  await rm(smokeRoot, { recursive: true, force: true });
  await mkdir(artifactsDir, { recursive: true });
  await mkdir(consumerDir, { recursive: true });
  await mkdir(npmCache, { recursive: true });

  const tarballPath = await packLibrary();
  await validateConsumer(tarballPath, opts.platforms);

  console.log(`PLRNUI-64 Expo 57 consumer smoke passed (${opts.platforms.join(", ")}) using ${tarballPath}`);
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = error instanceof UsageError ? 2 : 1;
  });
}
