import { useTheme } from "./useTheme.js";
import { resolveVariants, type AnyVariantsDefinition, type ResolvedSlots, type VariantProps, type VariantSlots, type VariantStates } from "./variants.js";

/**
 * The memoized per-slot style objects of a variants definition for the selected variants and active states, from the
 * current theme. The same inputs return the same object; a theme change recomputes (and applies `theme.variants`
 * overrides). Slot styles are plain React Native style objects, safe under Expo Go.
 */
export function useVariants<D extends AnyVariantsDefinition>(
  definition: D,
  variantProps?: VariantProps<D>,
  states?: VariantStates<D>
): ResolvedSlots<VariantSlots<D>> {
  const { theme } = useTheme();
  return resolveVariants(theme, definition, variantProps, states);
}
