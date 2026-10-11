// Type-level contract of the variant API (PLRNUI-181). Compiled by `tsc -p tsconfig.type-tests.json`.
import { buttonVariants } from "../../src/theme/variants/button.variants.js";
import { useVariants } from "../../src/theme/useVariants.js";
import { defineVariants, resolveVariants, type ResolvedSlots, type VariantOverrides, type VariantProps, type VariantSlots, type VariantStates } from "../../src/theme/variants.js";
import { createBaseTheme } from "../../src/theme/defaultTheme.js";
import type { Theme } from "../../src/theme/types.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// Variant props are inferred from the definition.
export type ButtonProps = Expect<
  Equal<VariantProps<typeof buttonVariants>, { variant?: "solid" | "outline" | "ghost" | "danger"; size?: "sm" | "md" | "lg" }>
>;
export type ButtonSlots = Expect<Equal<VariantSlots<typeof buttonVariants>, "root" | "label">>;
export type ButtonStates = Expect<Equal<VariantStates<typeof buttonVariants>, { pressed?: boolean; disabled?: boolean }>>;

declare const theme: Theme;

// Valid use compiles and returns the per-slot styles.
export const slots: ResolvedSlots<"root" | "label"> = resolveVariants(theme, buttonVariants, { variant: "ghost", size: "sm" }, { pressed: true });
export const rootStyle = slots.root;
export function usage() {
  return useVariants(buttonVariants, { variant: "danger" }, { disabled: true });
}
export const base = createBaseTheme("light");

// An invalid variant value fails to compile.
// @ts-expect-error "nope" is not a button variant
resolveVariants(theme, buttonVariants, { variant: "nope" });
// @ts-expect-error "huge" is not a button size
resolveVariants(theme, buttonVariants, { size: "huge" });
// @ts-expect-error unknown variant group
resolveVariants(theme, buttonVariants, { tone: "solid" });
// @ts-expect-error unknown state flag
resolveVariants(theme, buttonVariants, {}, { hovered: true });
// @ts-expect-error a state flag is a boolean
resolveVariants(theme, buttonVariants, {}, { pressed: "yes" });
// @ts-expect-error the same through the hook
useVariants(buttonVariants, { variant: "nope" });

// Overrides are checked against the definition: an unknown slot, group, option or state fails to compile.
export const okOverride: VariantOverrides<typeof buttonVariants> = {
  variants: { variant: { solid: { root: { backgroundColor: "red" } } } },
  defaultVariants: { size: "lg" },
  states: { pressed: { label: { opacity: 0.5 } } },
};
export const badSlot: VariantOverrides<typeof buttonVariants> = {
  // @ts-expect-error "icon" is not a slot of the button definition
  variants: { variant: { solid: { icon: { opacity: 1 } } } },
};
export const badOption: VariantOverrides<typeof buttonVariants> = {
  // @ts-expect-error "neon" is not a variant option
  variants: { variant: { neon: { root: {} } } },
};
export const badGroup: VariantOverrides<typeof buttonVariants> = {
  // @ts-expect-error "tone" is not a variant group
  variants: { tone: {} },
};
export const badState: VariantOverrides<typeof buttonVariants> = {
  // @ts-expect-error "hovered" is not a state
  states: { hovered: {} },
};
export const badDefault: VariantOverrides<typeof buttonVariants> = {
  // @ts-expect-error default option must exist
  defaultVariants: { variant: "neon" },
};

// Authoring: slots, compound conditions and defaults are checked against the declared variants.
export const tiny = defineVariants((t) => ({
  slots: ["root"],
  base: { root: { padding: t.space.sm } },
  variants: { tone: { quiet: { root: { opacity: 0.5 } }, loud: { root: { opacity: 1 } } } },
  compoundVariants: [{ when: { tone: "quiet" }, style: { root: { padding: 0 } } }],
  defaultVariants: { tone: "loud" },
}));
export type TinyProps = Expect<Equal<VariantProps<typeof tiny>, { tone?: "quiet" | "loud" }>>;

defineVariants(() => ({
  slots: ["root"],
  // @ts-expect-error "label" is not a declared slot
  base: { label: { opacity: 1 } },
}));
defineVariants(() => ({
  slots: ["root"],
  variants: { tone: { quiet: { root: {} } } },
  // @ts-expect-error compound conditions must name an existing option
  compoundVariants: [{ when: { tone: "loud" }, style: { root: {} } }],
}));
defineVariants(() => ({
  slots: ["root"],
  variants: { tone: { quiet: { root: {} } } },
  // @ts-expect-error default must name an existing option
  defaultVariants: { tone: "loud" },
}));
