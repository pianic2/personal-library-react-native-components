// Contract of the native capability layer (PLRNUI-138). Types only; no runtime, no native import.
// Naming rule: a capability id is a lowercase camelCase noun (`clipboard`, `haptics`); its api type is `<Id>Api`.

export interface ClipboardApi {
  getString(): Promise<string>;
  setString(value: string): Promise<void>;
}

export interface HapticsApi {
  impact(style?: "light" | "medium" | "heavy"): Promise<void>;
  notification(type: "success" | "warning" | "error"): Promise<void>;
  selection(): Promise<void>;
}

export interface ShareApi {
  share(content: { message?: string; url?: string; title?: string }): Promise<"shared" | "dismissed">;
}

export interface StorageApi {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface BiometricApi {
  isAvailable(): Promise<boolean>;
  authenticate(promptMessage: string): Promise<boolean>;
}

export interface NetworkApi {
  getStatus(): Promise<{ connected: boolean | null }>;
}

export type AppStateValue = "active" | "background" | "inactive";

export interface AppStateApi {
  getState(): AppStateValue;
  /** Calls `listener` on every change of the app state; returns the function that removes it. */
  subscribe(listener: (state: AppStateValue) => void): () => void;
}

/**
 * Every capability the library knows, keyed by id. The map is closed in 1.0: it is an interface of this package and is
 * not meant to be extended by module augmentation (the ids are semver surface). A new capability is a minor release.
 */
export interface CapabilityMap {
  clipboard: ClipboardApi;
  haptics: HapticsApi;
  share: ShareApi;
  storage: StorageApi;
  biometric: BiometricApi;
  network: NetworkApi;
  appState: AppStateApi;
}

export type CapabilityId = keyof CapabilityMap;

/** `available`: a real implementation. `unavailable`: its module was not provided. `noop`: nothing is configured. */
export type CapabilityStatus = "available" | "unavailable" | "noop";

export interface CapabilityAdapter<T = unknown> {
  id: CapabilityId;
  status: CapabilityStatus;
  api: T;
}

/** The adapter type for one capability id. */
export type AdapterFor<K extends CapabilityId> = CapabilityAdapter<CapabilityMap[K]>;

/** A set of adapters, at most one per capability id. */
export type CapabilityAdapters = { [K in CapabilityId]?: AdapterFor<K> };

export interface CapabilityRegistry {
  get<K extends CapabilityId>(id: K): AdapterFor<K> | undefined;
  set<K extends CapabilityId>(id: K, adapter: AdapterFor<K>): void;
}
