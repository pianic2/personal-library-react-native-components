import { useState } from "react";
import {
  Checkbox,
  Column,
  FormField,
  Input,
  RadioGroup,
  Switch,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function FormControlsExample() {
  const [name, setName] = useState("Ada");
  const [enabled, setEnabled] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [contact, setContact] = useState("email");

  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Input
            label="Stability note"
            value="Input, Switch, Checkbox, RadioGroup and FormField are beta public candidates imported from the root package."
            editable={false}
          />
          <Input label="Name" value={name} onChangeText={setName} />
          <Switch value={enabled} onChange={setEnabled} label="Enable updates" />
          <Checkbox
            checked={accepted}
            onChange={setAccepted}
            label="Accept terms"
          />
          <FormField label="Preferred contact">
            <RadioGroup
              value={contact}
              onChange={setContact}
              options={[
                { label: "Email", value: "email" },
                { label: "Phone", value: "phone" },
              ]}
            />
          </FormField>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
