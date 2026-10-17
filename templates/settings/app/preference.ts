/** The two preferences the theme toggle switches between. `system` is not offered by the toggle. */
export type ToggledPreference = "light" | "dark";

/** The `ThemeProvider` preference that the theme switch selects: `true` is dark, `false` is light. */
export function preferenceForSwitch(on: boolean): ToggledPreference {
  return on ? "dark" : "light";
}

/** The switch position that shows a preference. Any other preference (for example `system`) shows as off. */
export function isDarkPreference(preference: string): boolean {
  return preference === "dark";
}
