// src/gestures/Draggable.tsx
import React from "react";
import * as ReactNative from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useDrag, type UseDragOptions } from "./useDrag.js";

export interface DraggableProps extends UseDragOptions {
  children?: React.ReactNode;
  /** Style of the dragged view. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode; testID?: string }>;

/** A view the user can drag along an axis, clamped to bounds, settling on the nearest snap point. See `useDrag`. */
export function Draggable({ children, style, testID, ...dragOptions }: DraggableProps): React.ReactElement {
  const { style: dragStyle, panHandlers } = useDrag(dragOptions);
  const AnimatedView = (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View ?? (ReactNative.View as unknown as AnimatedViewType);
  const Host = AnimatedView as React.ComponentType<Record<string, unknown>>;
  return (
    <Host testID={testID} style={[style, dragStyle]} {...panHandlers}>
      {children}
    </Host>
  );
}
