import { useState } from "react";
import {
  Column,
  PasswordInput,
  Textarea,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function TextInputsExample() {
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <PasswordInput label="Password" value={password} onChangeText={setPassword} />
          <PasswordInput
            label="Password"
            showPasswordLabel="Show"
            hidePasswordLabel="Hide"
            value={password}
            onChangeText={setPassword}
          />
          <Textarea label="Note" helperText="Max 500 characters" rows={6} value={note} onChangeText={setNote} />
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
