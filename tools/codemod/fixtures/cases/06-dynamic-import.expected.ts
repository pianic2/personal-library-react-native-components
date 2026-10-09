export async function load() {
  const mod = await import("@texo-placeholder/ui");
  return mod;
}
