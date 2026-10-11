import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fontFamily, fontFamilySlots, fontSize, fontWeight, lineHeight, typography } from "../../src/tokens/typography.base";
import { resolveTextStyle, textRoles, textStyles, type TextRoleName } from "../../src/tokens/textStyles.base";

const ROLES: TextRoleName[] = ["display", "headline", "title", "body", "bodySmall", "label", "caption", "code", "price"];

describe("PLRNUI-160 typography tokens", () => {
  it("defines every role", () => {
    assert.deepEqual(Object.keys(textRoles).sort(), [...ROLES].sort());
  });

  it("gives every role an absolute lineHeight at least as large as its fontSize", () => {
    for (const role of ROLES) {
      const r = textRoles[role];
      assert.ok(Number.isInteger(r.lineHeight), `${role} lineHeight is an absolute pixel value`);
      assert.ok(r.lineHeight >= r.fontSize, `${role}: lineHeight ${r.lineHeight} < fontSize ${r.fontSize}`);
    }
  });

  it("sets maxFontSizeMultiplier for every role within the policy", () => {
    for (const role of ROLES) {
      const m = textRoles[role].maxFontSizeMultiplier;
      assert.ok(Number.isFinite(m) && m >= 1, `${role} has a multiplier`);
    }
    for (const role of ["body", "bodySmall", "caption", "code"] as const) assert.ok(textRoles[role].maxFontSizeMultiplier <= 2, role);
    for (const role of ["display", "headline", "label"] as const) assert.ok(textRoles[role].maxFontSizeMultiplier <= 1.3, role);
  });

  it("defines the three font family slots as non-empty fallback stacks", () => {
    assert.deepEqual(Object.keys(fontFamilySlots).sort(), ["body", "display", "mono"]);
    for (const stack of Object.values(fontFamilySlots)) assert.ok(typeof stack === "string" && stack.length > 0);
    for (const role of ROLES) assert.ok(textRoles[role].fontFamilySlot in fontFamilySlots, role);
  });

  it("keeps the existing typography exports unchanged", () => {
    assert.deepEqual(fontFamily, { regular: "System", mono: "monospace" });
    assert.deepEqual(fontSize, { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, xxxl: 42 });
    assert.deepEqual(lineHeight, { tight: 1.1, normal: 1.3, relaxed: 1.5 });
    assert.deepEqual(fontWeight, { regular: "400", medium: "500", semibold: "600", bold: "700" });
    assert.deepEqual(Object.keys(typography), ["fontFamily", "fontSize", "lineHeight", "fontWeight"]);
    assert.deepEqual(Object.keys(textStyles), ["display", "title", "heading", "body", "label", "caption", "code"]);
  });
});

describe("PLRNUI-160 resolveTextStyle", () => {
  for (const role of ROLES) {
    it(`resolves ${role}`, () => {
      const out = resolveTextStyle(undefined, role);
      const r = textRoles[role];
      assert.deepEqual(out.style, { fontFamily: fontFamilySlots[r.fontFamilySlot], fontSize: r.fontSize, lineHeight: r.lineHeight, fontWeight: r.fontWeight, letterSpacing: r.letterSpacing });
      assert.equal(out.allowFontScaling, true);
      assert.equal(out.maxFontSizeMultiplier, r.maxFontSizeMultiplier);
    });
  }

  it("uses a consumer font family override for its slot only", () => {
    const theme = { fontFamilies: { display: "Inter-Bold" } };
    assert.equal(resolveTextStyle(theme, "display").style.fontFamily, "Inter-Bold");
    assert.equal(resolveTextStyle(theme, "headline").style.fontFamily, "Inter-Bold");
    assert.equal(resolveTextStyle(theme, "body").style.fontFamily, fontFamilySlots.body);
    assert.equal(resolveTextStyle(theme, "code").style.fontFamily, fontFamilySlots.mono);
  });

  it("falls back to the stack when a slot override is missing or the theme is empty", () => {
    assert.equal(resolveTextStyle({}, "body").style.fontFamily, fontFamilySlots.body);
    assert.equal(resolveTextStyle({ fontFamilies: {} }, "price").style.fontFamily, fontFamilySlots.body);
  });

  it("throws a RangeError for an unknown role, including prototype keys", () => {
    assert.throws(() => resolveTextStyle(undefined, "heading" as never), RangeError);
    assert.throws(() => resolveTextStyle(undefined, "toString" as never), RangeError);
  });

  it("does not mutate the role table", () => {
    const before = JSON.stringify(textRoles);
    const out = resolveTextStyle(undefined, "body");
    (out.style as { fontSize: number }).fontSize = 1;
    assert.equal(JSON.stringify(textRoles), before);
  });
});
