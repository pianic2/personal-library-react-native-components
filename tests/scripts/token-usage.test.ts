import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const script = resolve(import.meta.dirname, "../../scripts/check-token-usage.mjs");
const roots: string[] = [];

function makeRoot(files: Record<string, string>, allowlist: unknown = { entries: [] }) {
  const root = mkdtempSync(join(tmpdir(), "token-usage-"));
  roots.push(root);
  for (const [name, content] of Object.entries(files)) {
    const full = join(root, "src", "components", name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  const allowPath = join(root, "allow.json");
  writeFileSync(allowPath, typeof allowlist === "string" ? allowlist : JSON.stringify(allowlist));
  return { root, allowPath };
}

function run(root: string, allowPath: string, extra: string[] = []) {
  const result = spawnSync(process.execPath, [script, "--root", root, "--allowlist", allowPath, ...extra], { encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop() as string, { recursive: true, force: true });
});

describe("PLRNUI-179 token usage lint", () => {
  it("passes on a component that only uses tokens", () => {
    const { root, allowPath } = makeRoot({ "A/A.tsx": 'const s = { backgroundColor: colors.surface, padding: theme.space.md };\n' });
    const r = run(root, allowPath);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /token usage ok/);
  });

  it("reports the Modal backdrop rgba literal with file and line, exit 1", () => {
    const lines = Array(38).fill("//").concat(['  <View', '    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}', "  />"]);
    const { root, allowPath } = makeRoot({ "Modal/Modal.tsx": lines.join("\n") });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /src\/components\/Modal\/Modal\.tsx:40: rgba\(0,0,0,0\.5\)/);
  });

  it("detects hex, rgb, hsl and named colors", () => {
    const source = ['const a = "#fff";', "const b = '#12345678';", 'const c = "rgb(1, 2, 3)";', 'const d = `hsla(0, 0%, 0%, .5)`;', 'const e = "Red";'].join("\n");
    const { root, allowPath } = makeRoot({ "B/B.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    for (const line of [1, 2, 3, 4, 5]) assert.match(r.err, new RegExp(`B/B\\.tsx:${line}:`));
  });

  it("does not flag look-alikes: ids, urls, non-color words, 5-digit hex", () => {
    const source = ['const a = "#section-1";', 'const b = "https://x.dev/#abcde";', 'const c = "redundant";', 'const d = "transparent";', 'const e = "#12345";'].join("\n");
    const { root, allowPath } = makeRoot({ "C/C.tsx": source });
    assert.equal(run(root, allowPath).code, 0);
  });

  it("skips boxShadow lines and comments", () => {
    const source = [
      "const s = { boxShadow: `0px 1px 2px rgba(0, 0, 0, ${opacity})` };",
      '// const old = "#ff0000";',
      '/* const x = "red";',
      '   const y = "#000"; */',
      'const ok = 1; // "#fff" in a trailing comment',
    ].join("\n");
    const { root, allowPath } = makeRoot({ "D/D.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 0, r.err);
  });

  it("scans nested directories and only .tsx files", () => {
    const { root, allowPath } = makeRoot({ "E/deep/E.tsx": 'const a = "#000";', "E/notes.ts": 'const a = "#000";' });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /E\/deep\/E\.tsx:1/);
    assert.doesNotMatch(r.err, /notes\.ts/);
  });

  it("allowlist entries with a reason suppress exactly that file and literal", () => {
    const { root, allowPath } = makeRoot(
      { "F/F.tsx": 'const a = "#fff";\nconst b = "#000";' },
      { entries: [{ file: "src/components/F/F.tsx", match: "#fff", reason: "brand logo is fixed by design" }] },
    );
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.doesNotMatch(r.err, /F\.tsx:1:/);
    assert.match(r.err, /F\.tsx:2: #000/);
  });

  it("every allowlist entry requires a non-empty reason (exit 2)", () => {
    for (const entry of [
      { file: "src/components/G/G.tsx", match: "#fff" },
      { file: "src/components/G/G.tsx", match: "#fff", reason: "   " },
      { file: "src/components/G/G.tsx", reason: "why" },
    ]) {
      const { root, allowPath } = makeRoot({ "G/G.tsx": 'const a = "#fff";' }, { entries: [entry] });
      const r = run(root, allowPath);
      assert.equal(r.code, 2, JSON.stringify(entry));
      assert.match(r.err, /requires a reason|non-empty string/);
    }
  });

  it("a stale allowlist entry fails the run", () => {
    const { root, allowPath } = makeRoot(
      { "H/H.tsx": "const a = 1;" },
      { entries: [{ file: "src/components/H/H.tsx", match: "#fff", reason: "was needed once" }] },
    );
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /stale allowlist entry/);
  });

  it("fails closed on a broken allowlist, a missing components dir and unknown arguments", () => {
    const broken = makeRoot({ "I/I.tsx": "const a = 1;" }, "{ not json");
    assert.equal(run(broken.root, broken.allowPath).code, 2);
    const noDir = mkdtempSync(join(tmpdir(), "token-usage-"));
    roots.push(noDir);
    writeFileSync(join(noDir, "allow.json"), '{"entries":[]}');
    assert.equal(run(noDir, join(noDir, "allow.json")).code, 2);
    const ok = makeRoot({ "J/J.tsx": "const a = 1;" });
    assert.equal(run(ok.root, ok.allowPath, ["--bogus"]).code, 2);
  });

  it("reports the numeric style literal count without failing", () => {
    const { root, allowPath } = makeRoot({ "K/K.tsx": "const s = { width: 10, height: 20, padding: 4, flex: 1 };" });
    const r = run(root, allowPath);
    assert.equal(r.code, 0);
    assert.match(r.out, /numeric literals in style objects \(informational, not failing\): 3/);
  });
});
