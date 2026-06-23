// ui/components/form/Select.tsx

import React, { useState } from "react";
import {
  Pressable,
  View,
  Modal,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select…",
  error = false,
}: SelectProps) {
  const { theme, colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: theme.radius.md,
          padding: theme.space.sm,
          backgroundColor: colors.surface,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          variant={selected ? "default" : "muted"}
          style={{ flex: 1 }}
        >
          {selected?.label ?? placeholder}
        </Text>

        <Text variant="muted" aria-hidden>
          v
        </Text>
      </Pressable>

      <Modal visible={open} transparent>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: "flex-end",
          }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: theme.space.md,
            }}
          >
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{ paddingVertical: theme.space.sm }}
              >
                <Text>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
