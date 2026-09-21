import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("compatibility docs check passes on governed output", () => {
  const result = spawnSync(process.execPath, ["scripts/compatibility-docs.mjs", "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("compatibility docs check rejects peer drift", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plrnui-compat-"));
  fs.cpSync(path.join(root, "scripts"), path.join(tmp, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "config"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "docs"), { recursive: true });
  fs.copyFileSync(path.join(root, "config/compatibility.json"), path.join(tmp, "config/compatibility.json"));
  fs.copyFileSync(path.join(root, "package.json"), path.join(tmp, "package.json"));
  const generated = fs.readFileSync(path.join(root, "docs/compatibility.md"), "utf8").replace(">=0.86.0 <0.87.0", ">=0.85.0 <0.86.0");
  fs.writeFileSync(path.join(tmp, "docs/compatibility.md"), generated);
  const result = spawnSync(process.execPath, ["scripts/compatibility-docs.mjs", "--check"], { cwd: tmp, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /drifts from package\.json/);
});
