# E14-04 report: module format, ESM-only vs dual ESM+CJS

- Ticket: PLRNUI-205 (E14-04)
- Question: should `@personal-library/react-native-components` stay ESM-only (as D7 / ADR-R6 assumes, "confirm by spike") or ship a dual ESM+CJS build, given the dual-package hazard for React contexts (`ThemeProvider`, `NavProvider`) and the risk that ESM-only breaks jest consumers?
- Method: build a CJS variant and four package variants in a scratch dir (nothing under `src/` or `package.json` changed), install each as a tarball into consumer fixtures, run Expo Metro (web + android), jest-expo, vitest, Node `require()` / `import`, and a purpose-built dual-package-hazard probe. Every cell below comes from a command in the appendix.

## Summary and recommendation

**Recommendation: stay ESM-only** (no `require` condition, no CJS build), and document two consumer settings: the jest-expo `transformIgnorePatterns` entry below and, for vitest, `server.deps.inline` for the package.

Reasoning, from the measurements:

1. **ESM-only works in every consumer tool that was run**, with one documented config line each for jest-expo and vitest. Expo Metro exports web and android, Node 22.12+ `require()` and `import` both load it, and a CommonJS dependency that `require()`s the package shares the same module instance as the app (one ThemeContext).
2. **The dual-package hazard is real and measured, not theoretical.** With a plain dual build (`import` -> ESM, `require` -> CJS): Node 22.22 throws `useThemeContext must be used inside ThemeProvider` when the app imports the package and a CommonJS dependency requires it, and the Metro web and android (`--no-bytecode`) bundles each contain **two copies** of the ThemeProvider module (one ESM, one CJS), i.e. two `ThemeContext` objects. Only jest-expo hid it, because jest transforms `import` into `require`, so both loads go through the same resolution (the CJS file was not inspected; the probe passed).
3. **Mitigations work but add permanent cost.** A `globalThis` singleton context (`Symbol.for` key, the approach planned in ADR 0013) removed the Node failure; an ESM wrapper over the CJS build (`import` -> `.mjs` that re-exports the CJS build) gave a single copy in Node and Metro. Both need to be applied to every module that holds identity (ThemeContext, NavContext, any future registry), tests must keep proving it, and the tarball grows from 35.2 KB to 46.5-47.0 KB (no source maps in these variants). ESM-only needs none of this.
4. **CJS-only is not an option for a modern RN library**: it passed Metro, jest-expo and Node, but vitest cannot alias `react-native` inside a CommonJS package (it fails with the Flow syntax error of the real `react-native`), and it would contradict the "ESM + `sideEffects: false`" direction of E14.
5. **Cost of ESM-only is bounded and known**: jest consumers without the `transformIgnorePatterns` entry fail with `SyntaxError: Unexpected token 'export'` (recorded below); Node below 22.12 cannot `require()` the package (`ERR_REQUIRE_ESM`, measured on 22.11.0), which is outside `engines` (`>=22.13.0`).

What the human must sign off (this report does not claim sign-off):

- Accept **ESM-only for 1.0** (closes the "confirm by spike" note on D7).
- Accept documenting the **jest-expo `transformIgnorePatterns`** entry and the **vitest `server.deps.inline`** entry in the install docs, as a known consumer requirement.
- Decide whether to add the **`globalThis` singleton contexts** anyway as cheap insurance (ADR 0013 already plans them for the legacy shim; with ESM-only they are not needed for correctness of the package itself, only if a second copy of the package is ever installed or bundled).
- Accept that **Node < 22.12** consumers cannot `require()` the package (they can still `import` it).

## Environment

| Item | Value |
| --- | --- |
| `node -v` | v22.22.0 (also v22.11.0 and v22.12.0 for the `require(esm)` boundary, installed from the `node` npm package into a scratch dir) |
| `npm -v` | 10.9.4 |
| `process.features.require_module` (22.22.0) | `true` |
| TypeScript (repo build, CJS build) | 5.9.3 |
| expo / react / react-dom / react-native / react-native-web | 57.0.21 / 19.2.3 / 19.2.3 / 0.86.3 / 0.21.2 (same set as `scripts/expo-consumer-smoke.mjs`) |
| jest-expo / jest | 57.0.5 / 29.7.0 (see "Risks": jest 30.0.5 failed even without the library) |
| vitest | 3.2.4 |
| react-test-renderer | 19.2.3 |
| Package under test | `@personal-library/react-native-components` 0.1.0-rc.2 at `202b66a` (origin/texo/v1), built with `npm run build` in a scratch copy |

## Method

- **Variants** (built by `build-variants.mjs`, Appendix A, each packed with `npm pack --ignore-scripts` and installed from the tarball with `npm install --no-save --ignore-scripts --prefer-offline`):
  - `esm`: today's package (`"type": "module"`, `dist/`, `exports` with `types`, `react-native`, `import`, `default`).
  - `cjs`: `tsc --module commonjs --moduleResolution node10 --esModuleInterop` output as `dist/`-equivalent, `"type": "commonjs"`, `exports` with `react-native`, `require`, `default`. A first attempt with a per-file esbuild transpile (`CJS_TOOL=esbuild`) is recorded under Risks.
  - `dual`: `exports` with `types`, `import` -> ESM `dist/`, `require` -> `dist-cjs/` (CJS), `default` -> ESM. Plain dual, no mitigation.
  - `dual-singleton`: `dual` plus `ThemeContext = globalThis[Symbol.for("@personal-library/rn-components:ThemeContext")] ??= createContext(null)` patched into both builds.
  - `dual-wrapper`: `import` -> `dist-esm-wrapper/*.mjs`, which does `import cjs from "<cjs build>"; export const { ... } = cjs`, so both conditions run the same CJS code.
- **Consumers**:
  - Expo fixture: `App.js` imports the package (ESM `import`); a local CommonJS dependency `fake-dep` does `require()` of the same package and renders a component that calls `useTheme()` inside the app's `ThemeProvider`. This is the hazard shape.
  - `expo export --platform web` / `--platform android` with `--no-minify`; additionally `--platform android --no-bytecode` (column "android-js") because Hermes bytecode de-duplicates strings, so counting copies in `.hbc` is unreliable. `bundle-check.mjs` checks the app markers and counts occurrences of the string `useThemeContext must be used inside ThemeProvider` (one per ThemeProvider module copy).
  - jest-expo: the same `App.js` rendered with `react-test-renderer`, once with a plain `preset: "jest-expo"` config and once with the fixed `transformIgnorePatterns`.
  - vitest: `react-native` aliased to `react-native-web`, a test rendering `ThemeProvider` + `useTheme` with `react-dom/server`.
  - Node: a stub `react-native` package (CJS and ESM entries) stands in for React Native (the real one is Flow source and cannot run in Node); scripts `node-require.cjs`, `node-import.mjs`, `hazard.mjs`.
- Failures were time-boxed to 3 attempts per tool.

## Results

Cell format: PASS, FAIL (reason), or not run. All FAIL/PASS cells were run on the final tarballs.

| Tool | ESM-only | CJS-only variant | Dual (plain) |
| --- | --- | --- | --- |
| Expo Metro web (`expo export --platform web`) | PASS (1 ThemeContext copy) | PASS (1 copy) | PASS build; **FAIL hazard: 2 copies** |
| Expo Metro android (`expo export --platform android`, Hermes) | PASS | PASS | PASS build; copies not countable in `.hbc`, **2 copies** in the `--no-bytecode` bundle |
| jest-expo, plain `preset: "jest-expo"` | **FAIL** `SyntaxError: Unexpected token 'export'` | PASS | PASS (no hazard observed; jest rewrites `import` to `require`) |
| jest-expo with fixed `transformIgnorePatterns` | PASS | PASS | PASS |
| vitest 3.2.4, default config (real `react-native` installed) | FAIL `SyntaxError: Unexpected token 'typeof'` (Flow source of `react-native` loaded natively; same for every format) | FAIL (same) | FAIL (same) |
| vitest with `server.deps.inline` + `react-native` -> `react-native-web` alias | PASS | FAIL `Unexpected token 'typeof'` (CJS is not aliased) | PASS |
| vitest with `react-native` replaced by a Node-level stub (default config) | PASS | PASS | PASS |
| Node 22.22 `require()` (root, `./theme`, `./tokens`) | PASS (53 exports, no warning) | PASS | PASS (resolves the CJS build) |
| Node 22.22 `import` (root, `./theme`, `./tokens`) | PASS (53 exports) | PASS (named exports detected: 55 keys incl. `default`) | PASS (53) |
| Node 22.12.0 `require()` | PASS with `ExperimentalWarning` | not run (CJS needs no `require(esm)`) | not run (same reason) |
| Node 22.11.0 `require()` | **FAIL** `ERR_REQUIRE_ESM` | not run | not run |
| Node 22.22 `require()` with `--no-experimental-require-module` | **FAIL** `ERR_REQUIRE_ESM` | not run | not run |

Dual variants with mitigations (same fixtures; "dual" above is the plain variant):

| Tool | dual-singleton | dual-wrapper |
| --- | --- | --- |
| Expo Metro web: module copies in bundle / build | PASS build; 2 module copies, 1 shared context at runtime by construction (runtime not executed in a browser) | PASS; 1 copy |
| Expo Metro android (`--no-bytecode`) | PASS build; 2 module copies | PASS; 1 copy |
| jest-expo (plain and fixed config) | PASS | PASS |
| vitest `server.deps.inline` + alias | PASS | FAIL `Unexpected token 'typeof'` (CJS not aliased) |
| Node import + require hazard probe | PASS | PASS |

## Dual-package hazard analysis

Probe (`hazard.mjs`, Appendix A): the app imports `ThemeProvider` and `useTheme` through ESM `import`; `fake-dep` (CommonJS) calls `require("@personal-library/react-native-components")` and renders a component that calls `useTheme()`. The whole tree is server-rendered under the app's `ThemeProvider`. If the two loads share one `ThemeContext`, the dependency sees `mode: dark`; if not, `useThemeContext` throws because the dependency's context has no provider above it.

| Variant | `lib.ThemeProvider === require(lib).ThemeProvider` | Render result (Node 22.22.0) |
| --- | --- | --- |
| esm | true | ok, dependency saw `dark` |
| cjs | true | ok, dependency saw `dark` |
| dual | false | **throws** `useThemeContext must be used inside ThemeProvider` |
| dual-singleton | false (two module copies) | ok, dependency saw `dark` (one context via `globalThis`) |
| dual-wrapper | true | ok, dependency saw `dark` |

Metro (`bundle-check.mjs` counts the guard message, one per ThemeProvider module copy; the dual web bundle contains both `exports.useThemeContext = useThemeContext` from the CJS build and the ESM-transformed function):

| Variant | web copies | android-js copies |
| --- | --- | --- |
| esm | 1 | 1 |
| cjs | 1 | 1 |
| dual | 2 | 2 |
| dual-singleton | 2 | 2 |
| dual-wrapper | 1 | 1 |

Reading the numbers:

- The hazard appears whenever the same package is reachable through both conditions in one runtime graph: Node (ESM app + CJS dependency) and Metro (Metro resolves `import` statements with the `import` condition and `require()` calls with `require`). It was not observed in jest-expo, which rewrites `import` to `require`; a library tested only under jest would never see it.
- In ESM-only the `require` call of a CommonJS dependency is served by Node's `require(esm)` (22.12+) or by Metro's resolver, both of which return the same module instance as the ESM import: zero copies in the measurements.
- The singleton removes the symptom (identical context object) but not the duplication: both copies still execute, so any other module-level state (theme registries, caches) stays duplicated unless it is also keyed on `globalThis`. This matters for the NavProvider context and any E6/E7 stack or registry added later.
- The wrapper removes the duplication but makes the CJS build the source of truth for ESM consumers (named exports are enumerated by a generated list, bundlers lose ESM tree-shaking for `import` consumers, and vitest cannot alias inside it).
- Not measured: a browser run of the Metro web bundle (the second copy is shown by bundle content, the throwing behavior by the equivalent Node probe), `NavProvider` (same pattern, `createContext(null)` at module scope per E14-06, so identical by construction), and a consumer that installs two versions of the package.

## Consumer config snippet

Verified in the Expo 57 fixture (jest-expo 57.0.5, jest 29.7.0). Without it the ESM-only package fails at the first import:

```
SyntaxError: Unexpected token 'export'

/node_modules/@personal-library/react-native-components/dist/index.js:1
export const PACKAGE_NAME = "@personal-library/react-native-components";
^^^^^^
(Jest encountered an unexpected token ... By default "node_modules" folder is ignored by transformers.)
```

Fix: add the package to the "do not ignore" group of the jest-expo default pattern. Setting `transformIgnorePatterns` replaces the preset's array, so the preset's other two entries are repeated. This exact config made the fixture test pass (App via `import` plus a CommonJS dependency via `require`, both inside one `ThemeProvider`):

```js
// jest.config.js
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@personal-library/react-native-components))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
};
```

Notes:

- The first entry is the jest-expo 57.0.5 default (`node_modules/jest-expo/jest-preset.js`) with `|@personal-library/react-native-components` appended. If a later jest-expo changes its default list, copy the new default and append the package; re-verify with the fixture.
- Covers the root and the `./theme` and `./tokens` subpaths (the pattern matches the package directory).
- vitest (verified in the fixture with vitest 3.2.4): `test.server.deps.inline: ["@personal-library/react-native-components"]` plus the usual `resolve.alias: { "react-native": "react-native-web" }`. Without `inline`, vitest loads the package natively and the real `react-native` fails with `SyntaxError: Unexpected token 'typeof'`; this is independent of module format (also failed for `dual`).
- Plain jest with the `react-native` preset (without jest-expo) was not run; the same package-directory entry in `transformIgnorePatterns` is the expected fix but is unverified.

## Risks and open questions

- **Node `require(esm)` by minor version** (measured): 22.11.0 `ERR_REQUIRE_ESM`; 22.12.0 works with an `ExperimentalWarning`; 22.22.0 works with no warning; `--no-experimental-require-module` brings back `ERR_REQUIRE_ESM`. `engines` is `>=22.13.0`, so supported Node versions are inside the working range; CommonJS tooling on older Node cannot `require()` the package. Also, `require(esm)` fails for ESM graphs that use top-level `await`; a grep for module-scope `await` in the built `dist/` found none (a lint or test guard would be needed to keep it so).
- **jest 30 vs jest-expo 57.0.5** (attempt 1 of 3 for jest-expo): with jest 30.0.5 even a library-free baseline test failed (`You are trying to import a file outside of the scope of the test code` from `expo/src/winter/runtime.native.ts`). jest-expo 57.0.5 depends on jest 29 packages, so the fixture uses jest 29.7.0. This is a fixture/tool compatibility finding, not related to the module format, but the docs snippet should state the jest version it was verified with.
- **esbuild-style CJS output and Node `import`**: a first CJS variant made by per-file esbuild transpile of `dist/` (`CJS_TOOL=esbuild`) exposed only 1 export (`default`) to Node ESM `import` and broke the hazard probe, because `export * from` became `__reExport(...)`, which Node's CJS named-export detection cannot see. `tsc` CommonJS output (`__exportStar`) is detected. If dual were ever chosen, the CJS must come from `tsc`, not esbuild per-file. This run of esbuild was before the final tarballs; the final table uses the `tsc` CJS.
- **Expo Metro with `react-native` condition**: the dual variants deliberately omit a `react-native` condition so Metro uses `import`/`require`. A variant that maps `react-native` to a single file would avoid the Metro duplication but was not measured. Metro itself resolves package exports in SDK 57 (observed: `import` and `require` conditions were honored).
- **Types**: a TypeScript consumer on `module: node16`/`nodenext` with a CommonJS project importing the ESM-only package, and a dual package's `.d.cts` needs, were not measured (no `tsc` consumer run in this spike; `scripts/consumer-smoke.mjs` covers type resolution for ESM).
- **Fixture caveats**: the Node and vitest fixtures use a stub `react-native`; Metro and jest-expo use the real one. vitest produced one stale-cache false result during the run (an ESM run reported the Flow error until `node_modules/.vite` was cleared); the final matrix cleared the cache before each run. The variants in the tarballs omit source maps (the `.map` files were stripped, which makes vitest print harmless "map file" warnings).
- **Not run**: browser execution of the exported web bundles, iOS export (not requested), Metro `expo start` dev server, webpack/Vite web consumers, plain `jest` with the react-native preset, Yarn/pnpm installs.

## Appendix: commands and scripts

All paths are scratch dirs under `/tmp/claude-0/spike205/` (`repo` = copy of the worktree with `node_modules` symlinked, `variants/` = tarballs, `expo/`, `node/`, `vitest/` = consumer fixtures).

### A.1 Build the ESM dist and the CJS dist

```sh
# ESM dist (repo script) and CJS dist (tsc), in the scratch copy of the repo
cd /tmp/claude-0/spike205/repo && npm run build
node_modules/.bin/tsc -p tsconfig.build.json --module commonjs --moduleResolution node10 --esModuleInterop \
  --declaration false --declarationMap false --sourceMap false --outDir /tmp/claude-0/spike205/dist-cjs-tsc
# five package variants + tarballs
node scripts/build-variants.mjs /tmp/claude-0/spike205/repo /tmp/claude-0/spike205/variants
```

`build-variants.mjs` (the unused esbuild branch used for the first CJS attempt is kept as it ran):

```js
// Builds package variants from a built ESM dist into <out>/<variant>/ and packs them.
// usage: node build-variants.mjs <repoDir> <outDir>
import { build } from "/tmp/claude-0/w201/node_modules/esbuild/lib/main.js";
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const [repo, out] = process.argv.slice(2);
const base = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const SUB = { ".": "index", "./theme": "theme/index", "./tokens": "tokens/index" };
const esm = (s) => `./dist/${s}.js`, cjs = (s) => `./dist-cjs/${s}.js`, dts = (s) => `./dist/${s}.d.ts`;
const SINGLETON = (name) => `const __K = Symbol.for("@personal-library/rn-components:${name}");`;

async function make(name, mutate, { withEsm, withCjs, singleton, wrapper, exportsMap, type }) {
  const dir = join(out, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (withEsm || wrapper) cpSync(join(repo, "dist"), join(dir, "dist"), { recursive: true, filter: (p) => !p.endsWith(".map") });
  if (withCjs || wrapper) {
    if (process.env.CJS_TOOL === "esbuild") {
      const files = walk(join(repo, "dist")).filter((f) => f.endsWith(".js"));
      await build({ entryPoints: files, outdir: join(dir, "dist-cjs"), outbase: join(repo, "dist"), format: "cjs", platform: "neutral", target: "es2022", bundle: false, logLevel: "error" });
    } else {
      // default: tsc --module commonjs output (prebuilt into <repo>/../dist-cjs-tsc, see appendix)
      cpSync(join(repo, "..", "dist-cjs-tsc"), join(dir, "dist-cjs"), { recursive: true });
    }
    writeFileSync(join(dir, "dist-cjs/package.json"), '{"type":"commonjs"}\n');
  }
  if (singleton) {
    for (const d of [withEsm && "dist", (withCjs || wrapper) && "dist-cjs"].filter(Boolean)) {
      const f = join(dir, d, "theme/ThemeProvider.js");
      let s = readFileSync(f, "utf8");
            s = s.replace(/(var |const )ThemeContext = ((?:\(0, (?:import_react|react_1)\.createContext\)|createContext))\(null\);/, (m, kw, fn) => `${SINGLETON("ThemeContext")}\n${kw}ThemeContext = globalThis[__K] ??= ${fn}(null);`);
      if (!s.includes("globalThis[__K]")) throw new Error("singleton patch failed " + f);
      writeFileSync(f, s);
    }
  }
  if (wrapper) {
    // ESM entry that re-exports the CJS build (single copy of module state)
    for (const [sub, s] of Object.entries(SUB)) {
      // names: load the CJS build with react-native / react stubbed (no node_modules next to the variant) and list its keys
      const Module = (await import("node:module")).default;
      const origLoad = Module._load;
      const stub = new Proxy(function () {}, { get: (t, k) => (k === "__esModule" ? false : k === "Platform" ? { OS: "ios", select: (o) => o.ios } : k === "StyleSheet" ? { create: (x) => x, flatten: (x) => x } : stub), apply: () => stub });
      Module._load = function (request, ...rest) {
        if (request === "react-native" || request.startsWith("react/") || request === "react") return stub;
        return origLoad.call(this, request, ...rest);
      };
      const mod = Module.createRequire(join(dir, "x.js"))(join(dir, "dist-cjs", s + ".js"));
      Module._load = origLoad;
      const list = Object.keys(mod).filter((k) => k !== "default" && k !== "__esModule");
      if (!list.length) throw new Error("no CJS exports for " + s);
      const up = "../".repeat(s.split("/").length);
      mkdirSync(join(dir, "dist-esm-wrapper", s.split("/").slice(0, -1).join("/")), { recursive: true });
      writeFileSync(join(dir, "dist-esm-wrapper", s + ".mjs"), `import cjs from "${up}dist-cjs/${s}.js";\nexport const { ${list.join(", ")} } = cjs;\n`);
    }
  }
  const pkg = { ...base, name: base.name, type: type ?? "module", exports: exportsMap, main: exportsMap["."].require ?? exportsMap["."].default, module: undefined, typesVersions: undefined, scripts: undefined, devDependencies: undefined, files: undefined };
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  const r = spawnSync("npm", ["pack", "--ignore-scripts", "--pack-destination", out], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  const tgz = r.stdout.trim().split("\n").pop();
  const final = join(out, `${name}.tgz`);
  spawnSync("mv", [join(out, tgz), final]);
  console.log(name, "->", final);
}

const map = (f) => Object.fromEntries(Object.entries(SUB).map(([k, s]) => [k, f(s)]));
await make("esm", null, { withEsm: true, exportsMap: map((s) => ({ types: dts(s), "react-native": esm(s), import: esm(s), default: esm(s) })) });
await make("cjs", null, { withCjs: true, type: "commonjs", exportsMap: map((s) => ({ "react-native": cjs(s), require: cjs(s), default: cjs(s) })) });
await make("dual", null, { withEsm: true, withCjs: true, exportsMap: map((s) => ({ types: dts(s), import: esm(s), require: cjs(s), default: esm(s) })) });
await make("dual-singleton", null, { withEsm: true, withCjs: true, singleton: true, exportsMap: map((s) => ({ types: dts(s), import: esm(s), require: cjs(s), default: esm(s) })) });
await make("dual-wrapper", null, { wrapper: true, withCjs: true, exportsMap: map((s) => ({ types: dts(s), import: `./dist-esm-wrapper/${s}.mjs`, require: cjs(s), default: cjs(s) })) });
```

### A.2 Expo fixture (Metro + jest-expo)

`package.json` (dependencies installed once with `npm install --no-audit --no-fund --ignore-scripts --prefer-offline`):

```json
{
 "name": "spike205-expo",
 "version": "0.0.0",
 "private": true,
 "main": "index.js",
 "dependencies": {
  "@personal-library/react-native-components": "file:./esm.tgz",
  "expo": "57.0.21",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "react-native": "0.86.3",
  "react-native-web": "0.21.2",
  "fake-dep": "file:./fake-dep"
 },
 "devDependencies": {
  "jest": "29.7.0",
  "jest-expo": "~57.0.0",
  "react-test-renderer": "19.2.3",
  "@types/react": "19.2.17"
 }
}
```

`App.js`, `index.js`, `fake-dep/index.js`, `app.json`:

```js
import React, { useState } from "react";
import { Box, Button, Card, Text, ThemeProvider, useTheme } from "@personal-library/react-native-components";
import { DepProbe } from "fake-dep";
function Probe() {
  const [count, setCount] = useState(0);
  const { mode, toggleTheme } = useTheme();
  return (
    <Box padding="md"><Card padding="md">
      <Text>{"Mode: " + mode + "; count: " + count}</Text>
      <Button label="Increment" onPress={() => setCount((n) => n + 1)} />
      <Button label="Toggle theme" onPress={toggleTheme} />
      <DepProbe />
    </Card></Box>
  );
}
export default function App() { return <ThemeProvider initialMode="light"><Probe /></ThemeProvider>; }

// index.js
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
```

```js
// fake-dep/index.js
// A CommonJS third-party dependency that uses the library through require() (e.g. a UI kit built on top of it).
const React = require("react");
const lib = require("@personal-library/react-native-components");
function DepProbe() {
  const { mode } = lib.useTheme();
  return React.createElement(lib.Text, null, "Dep sees mode: " + mode);
}
module.exports = { DepProbe };
```

```json
{"expo":{"name":"s205","slug":"s205","platforms":["android","ios","web"],"web":{"bundler":"metro"}}}
```

Metro runner and bundle checker:

```sh
#!/bin/bash
# usage: expo-run.sh <variant>   (run from the expo fixture dir) — swaps the library tarball, exports web+android unminified, counts ThemeContext copies
V=$1; cd /tmp/claude-0/spike205/expo
npm install --no-save --no-audit --no-fund --ignore-scripts --prefer-offline /tmp/claude-0/spike205/variants/$V.tgz >/tmp/claude-0/spike205/logs/expo-$V-install.log 2>&1 || { echo "INSTALL FAIL"; tail -5 /tmp/claude-0/spike205/logs/expo-$V-install.log; }
for P in web android android-js; do PL=${P%-js}; EXTRA=""; [ "$P" = android-js ] && EXTRA="--no-bytecode";
  rm -rf dist-$P
  CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform $PL $EXTRA --no-minify --output-dir dist-$P >/tmp/claude-0/spike205/logs/expo-$V-$P.log 2>&1
  echo "$V $P exit=$?"
  tail -3 /tmp/claude-0/spike205/logs/expo-$V-$P.log
done
```

```js
// usage: node bundle-check.mjs <expoDir>  -> per platform: markers present, number of ThemeContext module copies (error-string count), size
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const dir = process.argv[2];
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const [p, ext] of [["web", ".js"], ["android", ".hbc"], ["android-js", ".js"]]) {
  const files = walk(join(dir, "dist-" + p)).filter((f) => extname(f) === ext);
  const big = files.sort((a, b) => statSync(b).size - statSync(a).size)[0];
  const code = readFileSync(big, "latin1");
  const count = (s) => code.split(s).length - 1;
  console.log(JSON.stringify({ platform: p, bundle: big.replace(dir + "/", ""), bytes: statSync(big).size, markerIncrement: count("Increment") > 0, markerToggle: count("Toggle theme") > 0, depProbe: count("Dep sees mode") > 0, themeContextCopies: count("useThemeContext must be used inside ThemeProvider") }));
}
```

```sh
for V in esm cjs dual dual-singleton dual-wrapper; do scripts/expo-run.sh $V; node scripts/bundle-check.mjs expo; done
```

### A.3 jest-expo

`jest.config.js` (plain):

```js
module.exports = { preset: "jest-expo", testMatch: ["<rootDir>/__tests__/**/*.test.js"] };
```

`jest.config.fixed.js`: the snippet in "Consumer config snippet" plus `testMatch`.

`__tests__/app.test.js`:

```js
import React from "react";
import renderer, { act } from "react-test-renderer";
import App from "../App";

test("App (library via import) + CJS dependency (library via require) render under one ThemeProvider", () => {
  let tree;
  act(() => { tree = renderer.create(<App />); });
  const text = JSON.stringify(tree.toJSON());
  expect(text).toContain("Mode: light");
  expect(text).toContain("Dep sees mode: light");
});
```

```sh
#!/bin/bash
# usage: jest-run.sh <variant> [config]
V=$1; CFG=${2:-jest.config.js}; cd /tmp/claude-0/spike205/expo
npm install --no-save --no-audit --no-fund --ignore-scripts --prefer-offline /tmp/claude-0/spike205/variants/$V.tgz >/dev/null 2>&1
npx jest --config $CFG --no-cache 2>&1 | tail -${3:-40}
# for V in esm cjs dual dual-singleton dual-wrapper; do for C in jest.config.js jest.config.fixed.js; do scripts/jest-run.sh $V $C; done; done
```

Attempt log: jest 30.0.5 + jest-expo 57.0.5 failed on a library-free baseline test; `npm install --no-save jest@29.7.0` fixed it.

### A.4 vitest

`package.json` dependencies: `react`/`react-dom` 19.2.3, `react-native-web` 0.21.2, the tarball, dev `vitest` 3.2.4, `react-test-renderer` 19.2.3.

```js
import { defineConfig } from "vitest/config";
// Standard consumer setup for React Native libraries under vitest: react-native is aliased to react-native-web.
export default defineConfig({ resolve: { alias: { "react-native": "react-native-web" } }, test: { environment: "node", include: ["*.test.js"] } });

import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "react-native": "react-native-web" } },
  test: { environment: "node", include: ["*.test.js"], server: { deps: { inline: ["@personal-library/react-native-components"] } } },
});

import React from "react";
import { createRequire } from "node:module";
import { renderToString } from "react-dom/server";
import { test, expect } from "vitest";
import { ThemeProvider, useTheme, Text } from "@personal-library/react-native-components";
const require = createRequire(import.meta.url);

test("import resolves and renders under vitest", () => {
  function Probe() { const { mode } = useTheme(); return React.createElement(Text, null, "mode " + mode); }
  expect(renderToString(React.createElement(ThemeProvider, { initialMode: "dark" }, React.createElement(Probe)))).toContain("mode dark");
});
```

```sh
# per variant (cache cleared each run):
npm install --no-save --no-audit --no-fund --ignore-scripts --prefer-offline ../variants/$V.tgz
rm -rf node_modules/.vite node_modules/.vitest
npx vitest run --config vitest.config.mjs          # default
npx vitest run --config vitest.config.inline.mjs   # inline + alias
# stub variant: after npm install, replace node_modules/react-native with the Node fixture's rn-stub and run `npx vitest run`
```

### A.5 Node (require, import, hazard)

Fixture: `react` and `react-dom` 19.2.3, `react-native` = local stub package (`rn-stub/` with `exports: { import: ./index.mjs, require: ./index.cjs }`, exporting `View`, `Text`, `Pressable`, `Platform`, `StyleSheet`, ... as `div`-rendering stubs), `fake-dep` as above.

```js
// require() of the library from CommonJS. Prints export count and whether ThemeProvider is a function.
const lib = require("@personal-library/react-native-components");
const theme = require("@personal-library/react-native-components/theme");
const tokens = require("@personal-library/react-native-components/tokens");
console.log(JSON.stringify({ node: process.version, exports: Object.keys(lib).length, themeProvider: typeof lib.ThemeProvider, themeSubpath: typeof theme.ThemeProvider, tokensSubpath: typeof tokens.defaultThemeTokens, tokensKeys: Object.keys(tokens).length }));
```

```js
// import of the library from ESM (root + subpaths).
const lib = await import("@personal-library/react-native-components");
const theme = await import("@personal-library/react-native-components/theme");
const tokens = await import("@personal-library/react-native-components/tokens");
console.log(JSON.stringify({ node: process.version, exports: Object.keys(lib).length, themeProvider: typeof lib.ThemeProvider, themeSubpath: typeof theme.ThemeProvider, tokensSubpath: typeof tokens.defaultThemeTokens }));
```

```js
// Dual-package hazard probe. The app imports ThemeProvider/useTheme via ESM `import`; fake-dep (a CommonJS dependency)
// loads the same package via require(). If the two loads create two ThemeContext objects, DepProbe throws
// "useThemeContext must be used inside ThemeProvider" although it is rendered inside the app's ThemeProvider.
import { createRequire } from "node:module";
import React from "react";
import { renderToString } from "react-dom/server";
const lib = await import("@personal-library/react-native-components");
const require = createRequire(import.meta.url);
const viaRequire = require("@personal-library/react-native-components");
const { DepProbe } = require("fake-dep");
function Probe() { const { mode } = lib.useTheme(); return React.createElement(React.Fragment, null, React.createElement(lib.Text, null, "App sees mode: " + mode), React.createElement(DepProbe)); }
const out = { node: process.version, sameThemeProviderFunction: lib.ThemeProvider === viaRequire.ThemeProvider };
try {
  const html = renderToString(React.createElement(lib.ThemeProvider, { initialMode: "dark" }, React.createElement(Probe)));
  out.render = "ok"; out.depSawProvider = html.includes("Dep sees mode: dark");
} catch (e) { out.render = "THROWS"; out.error = String(e.message).split("\n")[0]; }
// useTheme outside any provider, from the dependency's copy (what a second context instance looks like)
console.log(JSON.stringify(out));
```

```sh
for V in esm cjs dual dual-singleton dual-wrapper; do
  npm install --no-save --no-audit --no-fund --ignore-scripts --prefer-offline ../variants/$V.tgz
  node node-require.cjs; node node-import.mjs; node hazard.mjs
done
node -v                                                 # v22.22.0
node --no-experimental-require-module node-require.cjs  # ERR_REQUIRE_ESM (esm variant)
# older Node: npm install --prefix nodes/n2211 node@22.11.0 ; npm install --prefix nodes/n22128 node@22.12.0
nodes/n2211/node_modules/node/bin/node node-require.cjs   # v22.11.0: ERR_REQUIRE_ESM
nodes/n22128/node_modules/node/bin/node node-require.cjs  # v22.12.0: works, ExperimentalWarning
```
