import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Advisories with no patched release, accepted temporarily (PLRNUI-457, PO-approved exemption).
// braces <=3.0.3: 3.0.3 is the latest published version. It is a transitive dependency of the
// react-native peer (metro), not code shipped by this package. The entry is valid through
// reviewBy (inclusive, UTC); from the next day the gate fails until it is reviewed.
export const ALLOWED = [{ id: "GHSA-vfj7-8cjw-p6xm", package: "braces", reviewBy: "2027-01-09" }];
const BLOCKING = new Set(["high", "critical"]);

const advisoryId = (item) => String(item.url ?? "").split("/").pop();
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

// Returns the list of problems; an empty list means the gate passes. Fails closed on any
// report that is not a complete `npm audit --json` v2 report (registry errors, empty output).
export function evaluateAudit(report, today, allowed = ALLOWED) {
  if (!isObject(report) || report.error || report.auditReportVersion !== 2 || !isObject(report.vulnerabilities)) {
    return [`npm audit did not return a valid report: ${JSON.stringify(report?.error ?? report?.message ?? "unexpected shape")}`];
  }
  const errors = [];
  for (const entry of allowed) {
    if (entry.reviewBy < today) errors.push(`allowlist entry ${entry.id} expired on ${entry.reviewBy}`);
  }
  // Only packages that own an advisory (via object) are checked; packages that merely inherit
  // severity through another vulnerable package (via is a package name) are covered by their root.
  for (const [name, vuln] of Object.entries(report.vulnerabilities)) {
    for (const item of (vuln.via ?? []).filter(isObject)) {
      const exempt = allowed.some((entry) => entry.package === name && entry.id === advisoryId(item));
      if (BLOCKING.has(item.severity) && !exempt) {
        errors.push(`${name} (${item.severity}): ${advisoryId(item)} ${item.title}`);
      }
    }
  }
  return errors;
}

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = evaluateAudit(runAudit(), new Date().toISOString().slice(0, 10));
  if (errors.length > 0) {
    console.error("npm audit gate failed:\n- " + errors.join("\n- "));
    process.exit(1);
  }
  console.log(`npm audit gate passed (accepted: ${ALLOWED.map((e) => `${e.id} until ${e.reviewBy}`).join(", ")})`);
}
