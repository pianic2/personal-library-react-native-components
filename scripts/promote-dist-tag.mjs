#!/usr/bin/env node
// Promotes a published version to an npm dist-tag (PLRNUI-132): rc -> next -> latest, or restores a previous tag.
// Fail-closed: before it moves a tag it checks that the registry holds exactly the artifact CI built.
//   node scripts/promote-dist-tag.mjs <package> <version> <tag> (--integrity <sri> | --tarball <file>) [options]
// Arguments
//   <package>  scoped or unscoped npm name; <version> an exact X.Y.Z or X.Y.Z-pre.N; <tag> one of rc, next, latest.
//   --integrity <sri>   the `sha512-...` integrity CI recorded for the tarball (what `npm view` shows as dist.integrity);
//   --tarball <file>    alternative: compute that integrity from the packed tarball of the release (exactly one of the two).
// Options
//   --dry-run           verify everything and print the planned `npm dist-tag` commands, change nothing.
//   --rollback          <version> is the previous version to restore on <tag>; the same integrity check applies.
//   --shim-of <pkg>     <package> is the legacy shim of <pkg>: promoting it to `latest` is allowed only after <pkg> is
//                       already `latest` at the same version.
//   --npm <executable>  npm to run (default `npm`; tests pass a fake).
// Tag rules: `latest` takes only a stable X.Y.Z; `rc` only X.Y.Z-rc.N; `next` any valid version.
// Exit codes: 0 done (or dry run ok), 1 a check refused the promotion or npm failed, 2 usage or unreadable input.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

class UsageError extends Error {}
class Refusal extends Error {}

const NAME = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?$/;
const STABLE = /^\d+\.\d+\.\d+$/;
const RC = /^\d+\.\d+\.\d+-rc\.\d+$/;
const SRI = /^sha512-[A-Za-z0-9+/]{86}==$/;
export const TAGS = ["rc", "next", "latest"];

export function parseArgs(argv) {
  const positional = [];
  const opts = { dryRun: false, rollback: false, integrity: undefined, tarball: undefined, shimOf: undefined, npm: "npm" };
  const withValue = { "--integrity": "integrity", "--tarball": "tarball", "--shim-of": "shimOf", "--npm": "npm" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--rollback") opts.rollback = true;
    else if (withValue[arg] !== undefined) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`${arg} needs a value`);
      opts[withValue[arg]] = value;
      i += 1;
    } else if (arg.startsWith("--")) throw new UsageError(`unknown argument: ${arg}`);
    else positional.push(arg);
  }
  if (positional.length !== 3) throw new UsageError("usage: promote-dist-tag.mjs <package> <version> <tag> (--integrity <sri> | --tarball <file>) [--dry-run] [--rollback] [--shim-of <package>] [--npm <executable>]");
  const [pkg, version, tag] = positional;
  if (!NAME.test(pkg)) throw new UsageError(`invalid package name: ${pkg}`);
  if (!VERSION.test(version)) throw new UsageError(`invalid version: ${version}`);
  if (!TAGS.includes(tag)) throw new UsageError(`tag must be one of ${TAGS.join(", ")}`);
  if ((opts.integrity === undefined) === (opts.tarball === undefined)) throw new UsageError("give exactly one of --integrity and --tarball");
  if (opts.integrity !== undefined && !SRI.test(opts.integrity)) throw new UsageError("--integrity must be a sha512 subresource integrity (sha512-<base64>)");
  if (opts.shimOf !== undefined && !NAME.test(opts.shimOf)) throw new UsageError(`invalid --shim-of package name: ${opts.shimOf}`);
  if (opts.shimOf === pkg) throw new UsageError("--shim-of must name a different package");
  return { pkg, version, tag, ...opts };
}

/** Whether `tag` may point at `version`. Throws a Refusal with the reason. */
export function checkTagRules(version, tag) {
  if (tag === "latest" && !STABLE.test(version)) throw new Refusal(`latest takes only a stable version, got ${version}`);
  if (tag === "rc" && !RC.test(version)) throw new Refusal(`rc takes only a release candidate X.Y.Z-rc.N, got ${version}`);
}

/** sha512 SRI of a tarball file, the same format as `npm view <pkg>@<version> dist.integrity`. */
export function integrityOf(file) {
  let bytes;
  try {
    bytes = readFileSync(resolve(file));
  } catch (error) {
    throw new UsageError(`cannot read the tarball ${file}: ${error.message}`);
  }
  return `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
}

function npm(opts, args) {
  const result = spawnSync(opts.npm, args, { encoding: "utf8" });
  if (result.error) throw new Refusal(`cannot run ${opts.npm}: ${result.error.message}`);
  return result;
}

function view(opts, spec, field) {
  const result = npm(opts, ["view", spec, field, "--json"]);
  if (result.status !== 0) throw new Refusal(`npm view ${spec} ${field} failed (exit ${result.status}): ${(result.stderr || "").trim().split("\n")[0]}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Refusal(`npm view ${spec} ${field} did not return JSON`);
  }
}

/** Runs the promotion. `log` receives the lines to print. Returns the list of planned or executed commands. */
export function promote(opts, log = console.log) {
  checkTagRules(opts.version, opts.tag);
  const expected = opts.integrity ?? integrityOf(opts.tarball);
  const actual = view(opts, `${opts.pkg}@${opts.version}`, "dist.integrity");
  if (actual !== expected) throw new Refusal(`integrity mismatch for ${opts.pkg}@${opts.version}: the registry has ${actual}, CI recorded ${expected}`);
  log(`integrity ok: ${opts.pkg}@${opts.version} is the artifact CI recorded (${expected.slice(0, 22)}...)`);

  if (opts.shimOf !== undefined && opts.tag === "latest") {
    const targetTags = view(opts, opts.shimOf, "dist-tags");
    if (targetTags.latest !== opts.version) throw new Refusal(`the shim can reach latest only after ${opts.shimOf} is latest at ${opts.version} (it is ${targetTags.latest ?? "not set"})`);
    log(`target ok: ${opts.shimOf} is latest at ${opts.version}`);
  }

  const tags = view(opts, opts.pkg, "dist-tags");
  const previous = tags[opts.tag];
  log(`${opts.tag} points at ${previous ?? "nothing"} now`);
  if (previous === opts.version) {
    log(`${opts.tag} already points at ${opts.version}: nothing to do`);
    return [];
  }
  const commands = [["dist-tag", "add", `${opts.pkg}@${opts.version}`, opts.tag]];
  const label = opts.rollback ? "rollback" : "promote";
  for (const command of commands) log(`${opts.dryRun ? "would run" : "run"} (${label}): npm ${command.join(" ")}`);
  if (previous !== undefined) log(`to undo: node scripts/promote-dist-tag.mjs ${opts.pkg} ${previous} ${opts.tag} --rollback --integrity <integrity of ${previous}>`);
  if (opts.dryRun) return commands;
  for (const command of commands) {
    const result = npm(opts, command);
    if (result.status !== 0) throw new Refusal(`npm ${command.join(" ")} failed (exit ${result.status}): ${(result.stderr || "").trim().split("\n")[0]}`);
  }
  log(`done: ${opts.tag} -> ${opts.pkg}@${opts.version}`);
  return commands;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  promote(opts);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`promote-dist-tag: ${error.message}`);
      process.exitCode = 2;
    } else if (error instanceof Refusal) {
      console.error(`promote-dist-tag: refused: ${error.message}`);
      process.exitCode = 1;
    } else {
      throw error;
    }
  }
}
