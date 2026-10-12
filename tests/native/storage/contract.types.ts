// Typed usage compiled by tsconfig.tests.json.
import { ThemeProvider } from "../../../src/theme/ThemeProvider.js";
import type { ThemeStorageAdapter } from "../../../src/theme/types.js";
import { createAsyncStorage, createMemoryStorage, createSecureStorage, createWebStorage, useStoredState } from "../../../src/native/storage/index.js";
import type { StorageAdapter } from "../../../src/native/storage/index.js";

declare const AsyncStorage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
declare const SecureStore: { getItemAsync(key: string): Promise<string | null>; setItemAsync(key: string, value: string): Promise<void>; deleteItemAsync(key: string): Promise<void> };

// A StorageAdapter is a ThemeStorageAdapter (the assignability the theme needs), for every backend.
export const themeStorages: ThemeStorageAdapter[] = [createMemoryStorage(), createWebStorage(), createAsyncStorage(AsyncStorage), createSecureStorage(SecureStore)];
export const adapter: StorageAdapter = createAsyncStorage(AsyncStorage);
export const provider = () => ThemeProvider({ storage: createAsyncStorage(AsyncStorage), children: null });
export const hook = () => useStoredState<{ n: number }>("k", { n: 0 }, { storage: adapter }).value.n;
