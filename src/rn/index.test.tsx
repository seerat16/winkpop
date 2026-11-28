import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Pressable, Text, TextInput, View } from "./index";

describe("web primitives", () => {
  it("View is a flex column unless flex-row is given", () => {
    render(
      <>
        <View testID="col" />
        <View testID="row" className="flex-row" />
      </>,
    );
    expect(screen.getByTestId("col").className).toContain("flex-col");
    expect(screen.getByTestId("row").className).not.toContain("flex-col");
  });

  it("Pressable is an accessible button for click and keyboard", () => {
    const onPress = vi.fn();
    render(
      <Pressable accessibilityLabel="Go" onPress={onPress}>
        <Text>Go</Text>
      </Pressable>,
    );
    const btn = screen.getByRole("button", { name: "Go" });
    fireEvent.click(btn);
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("disabled Pressable ignores taps", () => {
    const onPress = vi.fn();
    render(<Pressable accessibilityLabel="No" onPress={onPress} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("TextInput reports text changes and submit", () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    render(<TextInput accessibilityLabel="Search" onChangeText={onChangeText} onSubmitEditing={onSubmit} />);
    const input = screen.getByLabelText("Search");
    fireEvent.change(input, { target: { value: "Minji" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChangeText).toHaveBeenCalledWith("Minji");
    expect(onSubmit).toHaveBeenCalled();
  });
});
