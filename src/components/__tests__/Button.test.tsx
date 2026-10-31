import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";

describe("Button", () => {
  it("renders its title", () => {
    render(<Button title="Add to cart" />);
    expect(screen.getByText("Add to cart")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button title="Add to cart" onPress={onPress} />);
    fireEvent.press(screen.getByText("Add to cart"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while loading", () => {
    const onPress = jest.fn();
    render(<Button title="Save" loading onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button title="Save" disabled onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("hides the title while loading (spinner shown instead)", () => {
    render(<Button title="Save" loading />);
    expect(screen.queryByText("Save")).toBeNull();
  });
});
