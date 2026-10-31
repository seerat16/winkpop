import { render, screen, fireEvent } from "@testing-library/react-native";
import { Chip } from "../Chip";

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip label="Album" />);
    expect(screen.getByText("Album")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Chip label="POB" onPress={onPress} />);
    fireEvent.press(screen.getByText("POB"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes its selected state for accessibility", () => {
    render(<Chip label="Fansign" active />);
    const node = screen.getByRole("button");
    expect(node.props.accessibilityState).toMatchObject({ selected: true });
  });
});
