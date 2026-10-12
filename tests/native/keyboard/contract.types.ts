// Typed usage compiled by tsconfig.tests.json.
import { DismissKeyboardView, KeyboardAvoidingContainer, useKeyboard, useKeyboardVisible } from "../../../src/native/keyboard/index.js";
import type { KeyboardApi } from "../../../src/native/keyboard/index.js";

export const keyboard: () => KeyboardApi = () => useKeyboard();
export const visible: () => boolean = () => useKeyboardVisible();
export const form = () =>
  KeyboardAvoidingContainer({ offset: 56, children: DismissKeyboardView({ children: null }) });
