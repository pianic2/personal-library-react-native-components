import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
    const lines = Array(38).fill("const filler = 1;").concat(['  <View', '    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}', "  />"]);
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
    const source = ['const a = "#section-1";', 'const b = "https://x.dev/#abcde";', 'const c = "redundant";', 'const d = "transparent";', 'const e = "#12345";', 'const f = "&#123456;";'].join("\n");
    const { root, allowPath } = makeRoot({ "C/C.tsx": source });
    assert.equal(run(root, allowPath).code, 0);
  });

  it("exempts the value of a boxShadow property, and comments", () => {
    const source = [
      "const s = { boxShadow: `0px 1px 2px rgba(0, 0, 0, ${opacity})` };",
      'const t = { boxShadow: "0 0 1px black" };',
      '// const old = "#ff0000";',
      '/* const x = "red";',
      '   const y = "#000"; */',
      'const ok = 1; // "#fff" in a trailing comment',
    ].join("\n");
    const { root, allowPath } = makeRoot({ "D/D.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 0, r.err);
  });

  it("only the boxShadow value is exempt, not the rest of the line", () => {
    const { root, allowPath } = makeRoot({ "D2/D2.tsx": 'const s = { boxShadow: "0 0 1px black", color: "#abcdef" };' });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /D2\.tsx:1: #abcdef/);
    assert.doesNotMatch(r.err, /black/);
  });

  it("scans multi-line template literals and reports the real line", () => {
    const source = ["const css = `", "  color: #ff0000;", "  background: rgb(1,2,3);", "`;", 'const after = "#00ff00";'].join("\n");
    const { root, allowPath } = makeRoot({ "L/L.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /L\.tsx:2: #ff0000/);
    assert.match(r.err, /L\.tsx:3: rgb\(1,2,3\)/);
    assert.match(r.err, /L\.tsx:5: #00ff00/);
  });

  it("reports each color inside ${...} expressions separately", () => {
    const { root, allowPath } = makeRoot({ "T/T.tsx": 'const v = `${cond ? "#aaa" : "#bbb"} text`;' });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /T\.tsx:1: #aaa/);
    assert.match(r.err, /T\.tsx:1: #bbb/);
  });

  it("is not blinded by apostrophes, regex literals or URLs in JSX text", () => {
    const source = [
      `const a = <P>Don't</P>; const a2 = <X color="red" />;`,
      'const re = /"/; const d = "#0000ff";',
      'const j = <P>see http://x.com</P>; const k = "green";',
      `const m = <P>can't and won't</P>; const n = "#112233";`,
    ].join("\n");
    const { root, allowPath } = makeRoot({ "M/M.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /M\.tsx:1: red/);
    assert.match(r.err, /M\.tsx:2: #0000ff/);
    assert.match(r.err, /M\.tsx:3: green/);
    assert.match(r.err, /M\.tsx:4: #112233/);
  });

  it("finds named colors inside CSS-like compound values, uppercase hex and ternaries", () => {
    const source = ['const a = "1px solid red";', 'const b = "0 0 1px black";', 'const c = "#FFAA00";', 'const d = flag ? "navy" : theme.x;', 'const e = ["#abc", "white"] as const;'].join("\n");
    const { root, allowPath } = makeRoot({ "N/N.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    for (const [line, token] of [[1, "red"], [2, "black"], [3, "#FFAA00"], [4, "navy"], [5, "#abc"], [5, "white"]]) {
      assert.match(r.err, new RegExp(`N\\.tsx:${line}: ${token}`));
    }
  });

  it("does not flag prose that merely contains a color word or a #number", () => {
    const source = ['const a = "Item #1234";', 'const b = "Issue #123 is fixed";', 'const c = "Show the red items";', 'const d = "orange juice";'].join("\n");
    const { root, allowPath } = makeRoot({ "P/P.tsx": source });
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
    assert.match(r.out, /numeric literals in style objects \(informational, not failing\): 4/);
  });

  it("duplicate allowlist entries fail closed (the second one is stale)", () => {
    const entry = { file: "src/components/Q/Q.tsx", match: "#fff", reason: "fixed brand color" };
    const { root, allowPath } = makeRoot({ "Q/Q.tsx": 'const a = "#fff";' }, { entries: [entry, entry] });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    assert.match(r.err, /stale allowlist entry/);
  });

  it("an unreadable component file exits 2", () => {
    const { root, allowPath } = makeRoot({ "R/R.tsx": "const a = 1;" });
    symlinkSync(join(root, "does-not-exist"), join(root, "src", "components", "R", "Broken.tsx"));
    assert.equal(run(root, allowPath).code, 2);
  });

  it("the real tree: exit 0, or only the Modal backdrop literal (acceptance: 1 before the Modal ticket, 0 after)", () => {
    const repo = resolve(import.meta.dirname, "../..");
    const result = spawnSync(process.execPath, [script, "--root", repo], { encoding: "utf8" });
    if (result.status === 0) return;
    assert.equal(result.status, 1, result.stderr);
    const violations = result.stderr.split("\n").filter((line) => line.startsWith("hardcoded color:"));
    assert.deepEqual(violations, ["hardcoded color: src/components/Modal/Modal.tsx:40: rgba(0,0,0,0.5)"]);
    assert.doesNotMatch(result.stderr, /stale allowlist entry \(matches/);
  });

  it("a self-closing JSX tag after an expression does not hide later colors on the line", () => {
    const source = [
      'const a = c ? <A a={1} /> : <B c="#ff0000" />;',
      '{loading ? <Spinner size={s} /> : <Text style={{ color: "#00ff00" }}>x</Text>}',
      '<A {...p} /><B style={{color:"#0000ff"}} />',
    ].join("\n");
    const { root, allowPath } = makeRoot({ "S/S.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    for (const [line, token] of [[1, "#ff0000"], [2, "#00ff00"], [3, "#0000ff"]]) assert.match(r.err, new RegExp(`S\\.tsx:${line}: ${token}`));
  });

  it("recognises a regex after the return keyword and handles escaped quotes and nested templates", () => {
    const source = [
      'function f(x) { return /"/.test(x) && "#ff0000"; }',
      'const a = "say \\"hi\\""; const b = "#00ff00";',
      "const c = `${`${\"#0000ff\"}`}`;",
    ].join("\n");
    const { root, allowPath } = makeRoot({ "U/U.tsx": source });
    const r = run(root, allowPath);
    assert.equal(r.code, 1);
    for (const [line, token] of [[1, "#ff0000"], [2, "#00ff00"], [3, "#0000ff"]]) assert.match(r.err, new RegExp(`U\\.tsx:${line}: ${token}`));
  });

  it("fails closed (exit 2) on an unterminated template literal or block comment", () => {
    for (const source of ["const a = `#ff0000", "/* never closed\nconst a = 1;"]) {
      const { root, allowPath } = makeRoot({ "V/V.tsx": source });
      const r = run(root, allowPath);
      assert.equal(r.code, 2, source);
      assert.match(r.err, /V\/V\.tsx: unterminated/);
    }
  });
});
