import { execFileSync } from "node:child_process";

// Advisories with no patched release, accepted temporarily (PLRNUI-457, PO-approved exemption).
// braces <=3.0.3: 3.0.3 is the latest published version. It is a transitive dependency of the
// react-native peer (metro), not code shipped by this package. Re-review by the date below.
const ALLOWED = [{ id: "GHSA-vfj7-8cjw-p6xm", package: "braces", reviewBy: "2027-01-09" }];
const BLOCKING = new Set(["high", "critical"]);

let raw;
try {
  raw = execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  raw = error.stdout; // npm audit exits non-zero when it finds vulnerabilities
}
const { vulnerabilities = {} } = JSON.parse(raw);

const advisoryId = (item) => String(item.url ?? "").split("/").pop();
const advisories = (via) => via.filter((item) => typeof item === "object");
const isAllowed = (name, item) => ALLOWED.some((entry) => entry.package === name && entry.id === advisoryId(item));

const errors = [];
const today = new Date().toISOString().slice(0, 10);
for (const entry of ALLOWED) {
  if (entry.reviewBy < today) errors.push(`allowlist entry ${entry.id} expired on ${entry.reviewBy}`);
}

// Only packages that own an advisory are checked; packages that merely inherit severity
// through another vulnerable package (via is a list of names) are covered by their root.
for (const [name, vuln] of Object.entries(vulnerabilities)) {
  for (const item of advisories(vuln.via)) {
    if (BLOCKING.has(item.severity) && !isAllowed(name, item)) {
      errors.push(`${name} (${item.severity}): ${advisoryId(item)} ${item.title}`);
    }
  }
}

if (errors.length > 0) {
  console.error("npm audit gate failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`npm audit gate passed (accepted: ${ALLOWED.map((e) => `${e.id} until ${e.reviewBy}`).join(", ")})`);
