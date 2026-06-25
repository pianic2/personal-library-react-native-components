import { useState } from "react";
import {
  Checkbox,
  Column,
  FormField,
  Input,
  PasswordInput,
  RadioGroup,
  Switch,
  Textarea,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function FormControlsExample() {
  const [name, setName] = useState("Ada");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [contact, setContact] = useState("email");

  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Input
            label="Stability note"
            value="Input, Switch, Checkbox, RadioGroup and FormField are beta. PasswordInput and Textarea are internal / non-stable preview coverage."
            editable={false}
          />
          <Input label="Name" value={name} onChangeText={setName} />
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
          />
          <Textarea
            label="Message"
            value={message}
            onChangeText={setMessage}
          />
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
