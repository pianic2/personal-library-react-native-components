import type {
  AlertProps,
  ButtonProps,
  CardProps,
  CheckboxProps,
  DividerProps,
  InputProps,
  ProgressBarProps,
  SpinnerProps,
  FormFieldProps,
  HeadingProps,
  LinkProps,
  NavBarProps,
  NavItem,
  RadioGroupProps,
  SwitchProps,
  TextProps,
  TextareaProps,
  PasswordInputProps,
} from "../../src/index";
import type { BottomSheet, Modal, Popover, Select, Tooltip } from "../../src/index";
import type { ComponentProps } from "react";

// Every line below must be rejected by the compiler. If one starts to compile, the
// `@ts-expect-error` becomes an error and `npm run typecheck:contracts` fails.

// @ts-expect-error Button does not accept an unknown prop.
export const unknownButtonProp: ButtonProps = { label: "Save", colour: "red" };
// @ts-expect-error Button onPress takes no arguments.
export const wrongButtonHandler: ButtonProps = { onPress: (_event: string) => undefined };
// @ts-expect-error Button disabled must be a boolean.
export const wrongButtonDisabled: ButtonProps = { disabled: "yes" };

// @ts-expect-error Checkbox requires checked and onChange.
export const checkboxMissingRequired: CheckboxProps = { label: "Accept" };
// @ts-expect-error Switch requires value.
export const switchMissingValue: SwitchProps = { onChange: (_value: boolean) => undefined };
// @ts-expect-error Switch value must be boolean, not string.
export const switchWrongValue: SwitchProps = { value: "on", onChange: (_value: boolean) => undefined };

// @ts-expect-error RadioGroup options require label and value.
export const radioWrongOption: RadioGroupProps = { onChange: (_v: string) => undefined, options: [{ label: "A" }] };

// @ts-expect-error Link requires href.
export const linkMissingHref: LinkProps = { children: "Home" };
// @ts-expect-error NavBar requires pathname and navigate.
export const navBarMissingRouting: NavBarProps = { items: [] };
// @ts-expect-error NavItem requires href.
export const navItemMissingHref: NavItem = { label: "Home" };
// @ts-expect-error NavBar layout is a closed union.
export const navBarWrongLayout: NavBarProps = { pathname: "/", navigate: (_href: string) => undefined, layout: "diagonal" };

// @ts-expect-error FormField children must be a single element, not a string.
export const formFieldStringChild: FormFieldProps = { children: "text" };
// @ts-expect-error Heading children must be a string.
export const headingNumberChild: HeadingProps = { children: 3 };

// @ts-expect-error Text size must be a theme font size key.
export const textWrongSize: TextProps = { size: "gigantic" };
// @ts-expect-error Text truncate must be boolean.
export const textWrongTruncate: TextProps = { truncate: "yes" };

// @ts-expect-error Alert onAction takes no arguments.
export const alertWrongAction: AlertProps = { onAction: (_x: number) => undefined };

// @ts-expect-error Textarea owns multiline.
export const textareaMultiline: TextareaProps = { label: "Notes", multiline: false };
// @ts-expect-error PasswordInput owns secureTextEntry.
export const passwordSecure: PasswordInputProps = { label: "Password", secureTextEntry: false };
// @ts-expect-error PasswordInput owns rightIcon.
export const passwordRightIcon: PasswordInputProps = { label: "Password", rightIcon: null };

// Unexported props interfaces are still enforced through the component signature.
// @ts-expect-error Select requires options and onChange.
export const selectMissingRequired: ComponentProps<typeof Select> = { placeholder: "Pick" };
// @ts-expect-error Modal requires visible, onClose and children.
export const modalMissingRequired: ComponentProps<typeof Modal> = { size: "md" };
// @ts-expect-error Modal size is a closed union.
export const modalWrongSize: ComponentProps<typeof Modal> = { visible: true, onClose: () => undefined, children: null, size: "xl" };
// @ts-expect-error Popover requires renderTrigger.
export const popoverMissingTrigger: ComponentProps<typeof Popover> = { children: null };
// @ts-expect-error Tooltip content must be a string.
export const tooltipWrongContent: ComponentProps<typeof Tooltip> = { content: 1, children: null };
// @ts-expect-error BottomSheet requires visible and onClose.
export const bottomSheetMissingRequired: ComponentProps<typeof BottomSheet> = { children: null };

// @ts-expect-error Card variant is a closed union.
export const cardWrongVariant: CardProps = { variant: "flat" };
// @ts-expect-error Divider thickness must be a number.
export const dividerWrongThickness: DividerProps = { thickness: "thin" };
// @ts-expect-error ProgressBar progress must be a number.
export const progressWrongValue: ProgressBarProps = { progress: "half" };
// @ts-expect-error Spinner size is a closed union.
export const spinnerWrongSize: SpinnerProps = { size: "huge" };
// @ts-expect-error Input requires label.
export const inputMissingLabel: InputProps = { value: "x" };
