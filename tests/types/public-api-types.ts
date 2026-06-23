import type { RadioGroupOption, RadioGroupProps } from "../../src";

const option: RadioGroupOption = {
  label: "Email",
  value: "email",
};

const props: RadioGroupProps = {
  value: option.value,
  onChange: () => undefined,
  options: [option],
};

void props;
