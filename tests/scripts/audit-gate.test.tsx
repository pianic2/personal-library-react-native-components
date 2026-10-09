import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error plain ESM script without type declarations
import { evaluateAudit } from "../../scripts/audit-gate-lib.mjs";

const advisory = (id: string, severity: string) => ({
  source: 1,
  name: "pkg",
  title: `advisory ${id}`,
  url: `https://github.com/advisories/${id}`,
  severity,
});
const report = (vulnerabilities: Record<string, unknown>) => ({ auditReportVersion: 2, vulnerabilities });
const BRACES = "GHSA-vfj7-8cjw-p6xm";
const TODAY = "2026-10-09";

describe("PLRNUI-457 npm audit gate", () => {
  it("accepts the exempted braces advisory and packages that only inherit it", () => {
    const result = evaluateAudit(
      report({ braces: { via: [advisory(BRACES, "high")] }, micromatch: { via: ["braces"] } }),
      TODAY
    );
    assert.deepEqual(result, []);
  });

  it("rejects another high or critical advisory, including on braces", () => {
    assert.equal(evaluateAudit(report({ "shell-quote": { via: [advisory("GHSA-x", "critical")] } }), TODAY).length, 1);
    assert.equal(evaluateAudit(report({ braces: { via: [advisory("GHSA-other", "high")] } }), TODAY).length, 1);
  });

  it("ignores moderate and low advisories", () => {
    assert.deepEqual(evaluateAudit(report({ foo: { via: [advisory("GHSA-m", "moderate")] } }), TODAY), []);
  });

  it("rejects the exemption after its review date", () => {
    const errors = evaluateAudit(report({}), "2027-01-10");
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expired/);
    assert.deepEqual(evaluateAudit(report({}), "2027-01-09"), []);
  });

  it("blocks unknown or missing severities and malformed entries", () => {
    assert.equal(evaluateAudit(report({ foo: { via: [advisory("GHSA-u", "unknown")] } }), TODAY).length, 1);
    assert.equal(evaluateAudit(report({ foo: { via: [{ url: "https://github.com/advisories/GHSA-n" }] } }), TODAY).length, 1);
    assert.equal(evaluateAudit(report({ foo: null }), TODAY).length, 1);
    assert.equal(evaluateAudit(report({ foo: { via: "braces" } }), TODAY).length, 1);
  });

  it("rejects the exemption when expired even if the advisory is present", () => {
    const errors = evaluateAudit(report({ braces: { via: [advisory(BRACES, "high")] } }), "2027-01-10");
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expired/);
  });

  it("fails closed on error-shaped, empty or malformed reports", () => {
    for (const bad of [{ message: "ENOTFOUND", error: { code: "ENOTFOUND" } }, {}, null, "x", { auditReportVersion: 1, vulnerabilities: {} }]) {
      assert.equal(evaluateAudit(bad, TODAY).length, 1);
    }
  });
});
