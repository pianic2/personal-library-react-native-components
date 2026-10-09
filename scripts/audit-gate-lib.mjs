// Advisories with no patched release, accepted temporarily (PLRNUI-457, PO-approved exemption).
// braces <=3.0.3: 3.0.3 is the latest published version. It is a transitive dependency of the
// react-native peer (metro), not code shipped by this package. The entry is valid through
// reviewBy (inclusive, UTC); from the next day the gate fails until it is reviewed.
export const ALLOWED = [{ id: "GHSA-vfj7-8cjw-p6xm", package: "braces", reviewBy: "2027-01-09" }];
// Anything not known to be harmless blocks (unexpected or missing severities fail closed).
const NON_BLOCKING = new Set(["info", "low", "moderate"]);

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewBy)) errors.push(`allowlist entry ${entry.id} has an invalid reviewBy date`);
    else if (entry.reviewBy < today) errors.push(`allowlist entry ${entry.id} expired on ${entry.reviewBy}`);
  }
  // Only packages that own an advisory (via object) are checked; packages that merely inherit
  // severity through another vulnerable package (via is a package name) are covered by their root.
  for (const [name, vuln] of Object.entries(report.vulnerabilities)) {
    if (!isObject(vuln) || !Array.isArray(vuln.via)) {
      errors.push(`${name}: malformed entry in npm audit report`);
      continue;
    }
    for (const item of vuln.via.filter(isObject)) {
      const exempt = allowed.some((entry) => entry.package === name && entry.id === advisoryId(item));
      if (!NON_BLOCKING.has(item.severity) && !exempt) {
        errors.push(`${name} (${item.severity}): ${advisoryId(item)} ${item.title}`);
      }
    }
  }
  return errors;
}
