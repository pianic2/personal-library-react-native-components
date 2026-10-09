export async function load() {
  const mod = await import("@personal-library/react-native-components");
  return mod;
}
