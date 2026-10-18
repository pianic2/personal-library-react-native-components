import { useState } from "react";
import { Field, Input, ThemeProvider, useFieldControlProps } from "@personal-library/react-native-components";

function EmailInput({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return <Input accessibilityLabel="Email" value={value} onChangeText={onChangeText} {...useFieldControlProps()} />;
}

export function FieldExample() {
  const [email, setEmail] = useState("");
  const error = email.length > 0 && !email.includes("@") ? "Enter a valid email address" : undefined;

  return (
    <ThemeProvider>
      <Field required>
        <Field.Label>Email</Field.Label>
        <Field.Control>
          <EmailInput value={email} onChangeText={setEmail} />
        </Field.Control>
        <Field.Hint>We never share it</Field.Hint>
        <Field.Error>{error}</Field.Error>
      </Field>
    </ThemeProvider>
  );
}
