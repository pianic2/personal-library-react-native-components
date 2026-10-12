import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const text = readFileSync(join(root, ".github", "workflows", "release.yml"), "utf8");

/** Splits the `jobs:` section into { name: body } by the two-space-indented job keys. */
function jobs(source: string): Record<string, string> {
  const section = source.slice(source.indexOf("\njobs:\n") + 6);
  const result: Record<string, string> = {};
  const parts = section.split(/^  ([a-z][a-z0-9-]*):\s*$/m);
  for (let i = 1; i < parts.length; i += 2) result[parts[i]!] = parts[i + 1]!;
  return result;
}

const all = jobs(text);
const header = text.slice(0, text.indexOf("\njobs:\n"));
const code = (source: string) => source.split("\n").filter((line) => !line.trim().startsWith("#")).join("\n");

describe("PLRNUI-117 release workflow", () => {
  it("has the expected jobs", () => {
    assert.deepEqual(Object.keys(all), ["plan", "build", "publish-dry-run", "publish-target", "publish-shim", "github-release"]);
  });

  it("references no npm token and no repository secret", () => {
    assert.doesNotMatch(code(text), /NPM_TOKEN|NODE_AUTH_TOKEN|secrets\./);
  });

  it("uses only first-party actions (no third-party code in the release path)", () => {
    const uses = [...code(text).matchAll(/^\s*uses:\s*(\S+)/gm)].map((m) => m[1]!);
    assert.ok(uses.length > 0);
    for (const action of uses) assert.match(action, /^actions\/[\w-]+@v\d+$/, action);
    assert.doesNotMatch(code(text), /changesets\/action/);
  });

  it("starts on main pushes of package.json or CHANGELOG.md and on a manual run whose dry-run defaults to true", () => {
    assert.match(header, /push:\n\s+branches: \[main\]\n\s+paths:\n\s+- package\.json\n\s+- CHANGELOG\.md\n\s+workflow_dispatch:/);
    assert.match(header, /workflow_dispatch:\n\s+inputs:\n\s+dry-run:\n[\s\S]*?type: boolean\n\s+default: true/);
    assert.doesNotMatch(header, /pull_request/);
  });

  it("serialises releases and never cancels one in flight", () => {
    assert.match(header, /concurrency:\n\s+group: release\n\s+cancel-in-progress: false/);
  });

  it("grants read-only permissions by default, id-token only to the two publish jobs and contents: write only to the release job", () => {
    assert.match(header, /\npermissions:\n\s+contents: read\n/);
    for (const [name, body] of Object.entries(all)) {
      const wantsIdToken = name === "publish-target" || name === "publish-shim";
      assert.equal(/id-token: write/.test(body), wantsIdToken, `${name} id-token`);
      assert.equal(/contents: write/.test(body), name === "github-release", `${name} contents`);
    }
    assert.doesNotMatch(header, /id-token|contents: write/);
  });

  it("gates both real publishes on the npm-publish environment, shim after target, and never the dry run", () => {
    assert.match(all["publish-target"]!, /environment: npm-publish/);
    assert.match(all["publish-shim"]!, /environment: npm-publish/);
    assert.match(all["publish-shim"]!, /needs: \[plan, build, publish-target\]/);
    assert.doesNotMatch(all["publish-dry-run"]!, /environment:/);
    assert.doesNotMatch(all["publish-dry-run"]!, /id-token/);
  });

  it("publishes the packed tarballs with provenance, public access and the channel's dist-tag", () => {
    const target = code(all["publish-target"]!);
    assert.match(target, /npm publish --provenance --access public --tag "\$DIST_TAG" target\/\*\.tgz/);
    const shim = code(all["publish-shim"]!);
    assert.match(shim, /npm publish --provenance --access public --tag latest shim\/\*\.tgz/);
    for (const body of [target, shim]) assert.doesNotMatch(body, /--dry-run/);
  });

  it("logs npm publish --dry-run for both packages in the dry run, and publishes nothing for real", () => {
    const dry = code(all["publish-dry-run"]!);
    assert.match(dry, /npm publish --dry-run --access public --tag "\$DIST_TAG" target\/\*\.tgz/);
    assert.match(dry, /npm publish --dry-run --access public --tag latest shim\/\*\.tgz/);
    assert.equal([...dry.matchAll(/npm publish/g)].length, [...dry.matchAll(/npm publish --dry-run/g)].length);
    assert.match(all["publish-dry-run"]!, /if: needs\.plan\.outputs\.dry_run == 'true'/);
    assert.match(all["publish-target"]!, /if: needs\.plan\.outputs\.dry_run != 'true' && needs\.plan\.outputs\.publish == 'true'/);
  });

  it("verifies the attestations after each real publish and requires npm >= 11.5.1", () => {
    for (const name of ["publish-target", "publish-shim"]) assert.match(all[name]!, /dist\.attestations/, name);
    assert.match(all["publish-target"]!, /11\.5\.1|b < 5/);
  });

  it("creates the release only after the publishes succeeded", () => {
    const release = all["github-release"]!;
    assert.match(release, /needs: \[plan, publish-target, publish-shim\]/);
    assert.match(release, /needs\.publish-target\.result == 'success'/);
    assert.match(release, /needs\.publish-shim\.result == 'success' \|\| needs\.publish-shim\.result == 'skipped'/);
  });

  it("builds from one packed tarball that is uploaded once and downloaded by each publish job", () => {
    assert.match(all["build"]!, /name: release-target/);
    assert.match(all["build"]!, /name: release-shim/);
    assert.match(all["publish-target"]!, /name: release-target/);
    assert.match(all["publish-shim"]!, /name: release-shim/);
    assert.match(all["build"]!, /npm run release:check/);
    assert.match(all["build"]!, /release-guard\.mjs --channel "\$CHANNEL"/);
  });

  it("never interpolates an expression into a run script, and only a run on main can publish for real", () => {
    for (const [name, body] of Object.entries(all)) {
      const runs = [...body.matchAll(/^\s+run:\s*(\|\n((?:\s{10,}.*\n?)+)|.*)/gm)].map((m) => m[0]);
      for (const run of runs) assert.doesNotMatch(run, /\$\{\{/, `${name} has an expression inside a run script`);
    }
    assert.match(all["plan"]!, /REF: \$\{\{ github\.ref \}\}/);
    assert.match(all["plan"]!, /refs\/heads\/main/);
    assert.match(all["plan"]!, /pkg\.name !== identity\.current/);
    assert.match(all["plan"]!, /\^@\[a-z0-9~-\]/);
  });

  it("repeats the dry-run guard in the shim job and checks npm in both publish jobs", () => {
    assert.match(all["publish-shim"]!, /if: needs\.plan\.outputs\.dry_run != 'true' && needs\.plan\.outputs\.publish == 'true' && needs\.plan\.outputs\.shim == 'true'/);
    for (const name of ["publish-target", "publish-shim"]) assert.match(all[name]!, /too old for trusted publishing/, name);
  });

  it("the planning step reads the version from package.json and asks npm before it publishes", () => {
    const plan = all["plan"]!;
    assert.match(plan, /npm", \["view"/);
    assert.match(plan, /already on npm: nothing to publish/);
    assert.match(plan, /includes\("-rc\."\) \? "rc" : "latest"/);
  });
});
