// ui/components/overlay/Popover.tsx

import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Box } from "../Box";

type Placement = "bottom" | "top" | "right" | "left";

interface PopoverProps {
  renderTrigger: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  gap?: keyof ReturnType<typeof useTheme>["theme"]["space"];
}

export function Popover({
  renderTrigger,
  children,
  placement = "top",
  gap = "xs",
}: PopoverProps) {
  const { theme, colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [anchorSize, setAnchorSize] = useState<{ width: number; height: number } | null>(null);

  const toggle = () => setOpen((v) => !v);

  if (Platform.OS !== "web") {
    // Su mobile → BottomSheet / Modal
    return <>{renderTrigger({ open, toggle })}</>;
  }

  const popoverStyle = (() => {
    if (!anchorSize) return { opacity: 0 };

    switch (placement) {
      case "bottom":
        return { top: anchorSize.height + theme.space[gap], left: 0 };
      case "top":
        return { bottom: anchorSize.height + theme.space[gap], left: 0 };
      case "right":
        return { left: anchorSize.width + theme.space[gap], top: 0 };
      case "left":
        return { right: anchorSize.width + theme.space[gap], top: 0 };
    }
  })();

  return (
    <View style={{ alignSelf: "flex-start", position: "relative" }}>
      {/* ANCHOR */}
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setAnchorSize({ width, height });
        }}
      >
        <Pressable onPress={toggle}>
          {renderTrigger({ open, toggle })}
        </Pressable>
      </View>

      {/* POPOVER */}
      {open && anchorSize && (
        <View
          style={{
            position: "absolute",
            zIndex: theme.zIndex.overlay,
            ...popoverStyle,
          }}
        >
          <Box
            bg="surface"
            radius="md"
            shadow="md"
            padding="sm"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              minWidth: 180,
            }}
          >
            {children}
          </Box>
        </View>
      )}
    </View>
  );
}
