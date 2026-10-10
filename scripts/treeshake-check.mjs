#!/usr/bin/env node
// Tree-shaking check (PLRNUI-208, E14-05; from E12-05). With package.json "sideEffects": false, an esbuild bundle of
// `import { Button } from <root barrel>` must contain Button's source and none of the other components' source.
// A negative control (esbuild ignoreAnnotations, i.e. sideEffects ignored) must pull the other components in; if it does
// not, the assertion is not sensitive and the check fails. Exit 0 ok, 1 failure or error.
// Usage: node scripts/treeshake-check.mjs [--json]
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleFixture } from "./bundle-size.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const USED = "src/components/Button/Button.tsx";
export const UNUSED = ["src/components/Modal/Modal.tsx", "src/components/BottomSheet/BottomSheet.tsx", "src/components/Select/Select.tsx"];
const ROOT_BUTTON = 'import { Button } from "./src/index.ts"; console.log(Button);';
const DIRECT_BUTTON = 'import { Button } from "./src/components/Button/index.ts"; console.log(Button);';

/** Returns { failures, report }; failures is empty when every assertion holds. */
export async function runChecks() {
  const failures = [];
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (pkg.sideEffects !== false) failures.push(`package.json sideEffects must be false, got ${JSON.stringify(pkg.sideEffects)}`);

  const shaken = await bundleFixture(ROOT_BUTTON);
  const control = await bundleFixture(ROOT_BUTTON, { ignoreAnnotations: true });
  const direct = await bundleFixture(DIRECT_BUTTON);

  if (!shaken.inputs.includes(USED)) failures.push(`root Button bundle does not contain ${USED}`);
  for (const file of UNUSED) {
    if (shaken.inputs.includes(file)) failures.push(`root Button bundle contains unused component source ${file}`);
    if (!control.inputs.includes(file)) failures.push(`negative control (sideEffects ignored) does not contain ${file}; check is not sensitive`);
  }
  if (!direct.inputs.includes(USED)) failures.push(`direct Button bundle does not contain ${USED}`);
  for (const file of UNUSED) if (direct.inputs.includes(file)) failures.push(`direct Button bundle contains ${file}`);
  if (shaken.gzip >= control.gzip) failures.push(`tree-shaken bundle (${shaken.gzip} B) is not smaller than the unshaken control (${control.gzip} B)`);

  return {
    failures,
    report: {
      rootButton: { gzip: shaken.gzip, files: shaken.inputs.length },
      rootButtonSideEffectsIgnored: { gzip: control.gzip, files: control.inputs.length },
      directButton: { gzip: direct.gzip, files: direct.inputs.length },
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--json")) throw new Error(`unknown argument: ${args.find((arg) => arg !== "--json")}`);
  const { failures, report } = await runChecks();
  if (args.includes("--json")) console.log(JSON.stringify({ failures, report }, null, 2));
  else {
    console.log(`root Button (sideEffects:false):   ${report.rootButton.gzip} B gzip, ${report.rootButton.files} source files`);
    console.log(`root Button (sideEffects ignored): ${report.rootButtonSideEffectsIgnored.gzip} B gzip, ${report.rootButtonSideEffectsIgnored.files} source files`);
    console.log(`direct Button import:              ${report.directButton.gzip} B gzip, ${report.directButton.files} source files`);
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exitCode = 1;
  } else if (!args.includes("--json")) console.log("treeshake-check: ok (unused components absent from the Button bundle)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`treeshake-check: ${error.message}`);
    process.exitCode = 1;
  });
}
