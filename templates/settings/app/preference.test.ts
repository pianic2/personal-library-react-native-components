import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDarkPreference, preferenceForSwitch } from "./preference";

// Run from the repository root: node --import tsx --test templates/settings/app/preference.test.ts
describe("theme toggle", () => {
  it("switching on selects the dark ThemeProvider preference", () => {
    assert.equal(preferenceForSwitch(true), "dark");
  });

  it("switching off selects the light ThemeProvider preference", () => {
    assert.equal(preferenceForSwitch(false), "light");
  });

  it("the switch position follows the preference, and round-trips between light and dark", () => {
    assert.equal(isDarkPreference("dark"), true);
    assert.equal(isDarkPreference("light"), false);
    assert.equal(isDarkPreference("system"), false);
    for (const preference of ["light", "dark"] as const) {
      assert.equal(preferenceForSwitch(!isDarkPreference(preference)), preference === "dark" ? "light" : "dark");
    }
  });
});
