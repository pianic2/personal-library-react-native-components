import React from "react";

type HostProps = Record<string, unknown> & {
  children?: React.ReactNode;
};

function createHostComponent(name: string) {
  return React.forwardRef<unknown, HostProps>(function HostComponent(
    { children, ...props },
    ref
  ) {
    return React.createElement(name, { ...props, ref }, children);
  });
}

export const View = createHostComponent("View");
export const ScrollView = createHostComponent("ScrollView");
export const Pressable = createHostComponent("Pressable");
export const Modal = createHostComponent("Modal");
export const Text = createHostComponent("Text");
export const TextInput = createHostComponent("TextInput");
export const ActivityIndicator = createHostComponent("ActivityIndicator");

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
  flatten<T>(style: T): T {
    return style;
  },
};

export const Platform = {
  OS: "test",
  select<T>(options: Record<string, T>): T | undefined {
    return options.test ?? options.default;
  },
};

export const Linking = {
  async openURL(_url: string): Promise<void> {
    return undefined;
  },
};

export function useWindowDimensions() {
  return {
    fontScale: 1,
    height: 800,
    scale: 1,
    width: 1280,
  };
}
