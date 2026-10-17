// Typed usage compiled by tsconfig.tests.json. The module is declared locally: expo-splash-screen is not imported.
import React from "react";
import { AppReadyGate, createExpoSplash, createNoopSplash, useAppReady, useHydratedTask } from "../../../src/native/app-ready/index.js";
import type { AppReadyState, AppReadyTask, SplashAdapter } from "../../../src/native/app-ready/index.js";

declare const SplashScreen: { preventAutoHideAsync(): Promise<boolean>; hideAsync(): Promise<boolean> };

export const splash: SplashAdapter = createExpoSplash(SplashScreen);
export const web: SplashAdapter = createNoopSplash();
export const task: AppReadyTask = async () => undefined;
export const hook: () => AppReadyState = () => useAppReady({ tasks: [task], timeoutMs: 5000, splash, onError: (error: unknown) => void error });
export const hydrated: (flag: boolean) => AppReadyTask = (flag) => useHydratedTask(flag);
export const gate = React.createElement(AppReadyGate, { tasks: [task], splash, fallback: null }, "content");
