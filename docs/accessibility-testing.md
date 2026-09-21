# Accessibility testing baseline

The test suite includes reusable static assertions for React Native accessibility
role, accessible name/label, state/value and deterministic style-based minimum
touch-target dimensions.

These checks are **renderer/static contract evidence only**. They do not prove
VoiceOver, TalkBack, focus order, spoken announcement quality, gesture behavior,
contrast, dynamic type or physical device behavior. Device/assistive-technology
claims require separate runtime evidence.

`assertMinimumTouchTarget` is valid only when a component exposes deterministic
minimum dimensions in the rendered style. It must not be used to infer measured
layout dimensions that the test renderer does not calculate.

A negative harness test is intentionally retained so CI proves that missing
semantics are detected rather than merely exercising a no-op helper.
