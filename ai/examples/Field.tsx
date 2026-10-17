// @ai-example
import { Field, Input, useFieldControlProps } from "@personal-library/react-native-components";

function EmailInput() {
  return <Input accessibilityLabel="Email" {...useFieldControlProps()} />;
}

export function FieldExample() {
  return (
    <Field required>
      <Field.Label>Email</Field.Label>
      <Field.Control>
        <EmailInput />
      </Field.Control>
      <Field.Hint>We never share it</Field.Hint>
      <Field.Error>Enter a valid address</Field.Error>
    </Field>
  );
}
