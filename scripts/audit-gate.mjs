import { execFileSync } from "node:child_process";
import { ALLOWED, evaluateAudit } from "./audit-gate-lib.mjs";

function runAudit() {
  let raw;
  try {
    raw = execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    raw = error.stdout; // npm audit exits non-zero when it finds vulnerabilities
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { error: "npm audit produced no parsable JSON output" };
  }
}

const errors = evaluateAudit(runAudit(), new Date().toISOString().slice(0, 10));
if (errors.length > 0) {
  console.error("npm audit gate failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`npm audit gate passed (accepted: ${ALLOWED.map((e) => `${e.id} until ${e.reviewBy}`).join(", ")})`);
