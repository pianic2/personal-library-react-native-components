// ui/components/overlay/Tooltip.tsx

import React, { useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text";

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: string;
  placement?: Placement;
  delay?: number;
  children: React.ReactNode;
}

export function Tooltip({
  content,
  placement = "top",
  delay = 1000,
  children,
}: TooltipProps) {
  const { theme, colors } = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [anchorSize, setAnchorSize] =
    useState<{ width: number; height: number } | null>(null);

  if (Platform.OS !== "web") return <>{children}</>;

  function show() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }

  function hide() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen(false);
  }

  const gap = theme.space.sm;

  const tooltipStyle = (() => {
    if (!anchorSize) return { top: 50, left: 50 };

    switch (placement) {
      case "bottom":
        return { top: anchorSize.height + gap, left: 0 };
      case "top":
        return { bottom: anchorSize.height + gap, left: 0 };
      case "right":
        return { left: anchorSize.width + gap, top: 0 };
      case "left":
        return { right: anchorSize.width + gap, top: 0 };
    }
  })();

  return (
    <View style={{ alignSelf: "flex-start", position: "relative" }}>
      {/* ANCHOR */}
      <Pressable
        onHoverIn={show}
        onHoverOut={hide}
        onPressIn={show}
        onPressOut={hide}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setAnchorSize({ width: width + 10, height: height + 10 });
        }}
      >
        {children}
      </Pressable>

      {/* TOOLTIP */}
      {open && anchorSize && (
        <View
          style={{
            position: "absolute",
            zIndex: theme.zIndex.tooltip,
            backgroundColor: colors.textPrimary,
            paddingHorizontal: theme.space.sm,
            paddingVertical: 6,
            borderRadius: theme.radius.sm,
            maxWidth: 260,
            ...tooltipStyle,
          }}
        >
          <Text size="sm" style={{ color: colors.textInverted }}>
            {content}
          </Text>
        </View>
      )}
    </View>
  );
}
