import { render, screen, fireEvent } from "@testing-library/react-native";
import CartScreen from "../cart";
import { useUserStore } from "@/data/userStore";
import { PHOTOCARDS } from "@/data/photocards";

describe("CartScreen", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, hydrated: true });
    useUserStore.getState().loginDemo();
  });

  it("shows the empty state when the cart has no cards", () => {
    render(<CartScreen />);
    expect(screen.getByText("Your cart is empty")).toBeTruthy();
  });

  it("lists cards and computes subtotal + 5% buyer protection + total", () => {
    const [a, b] = PHOTOCARDS;
    useUserStore.getState().toggleCart(a.id);
    useUserStore.getState().toggleCart(b.id);

    render(<CartScreen />);

    const subtotal = a.price + b.price;
    const fee = subtotal * 0.05;
    const total = subtotal + fee;

    expect(screen.getByText(`$${subtotal.toFixed(2)}`)).toBeTruthy();
    expect(screen.getByText(`$${fee.toFixed(2)}`)).toBeTruthy();
    expect(screen.getByText(`$${total.toFixed(2)}`)).toBeTruthy();
    expect(screen.getByText("Checkout securely")).toBeTruthy();
  });

  it("removes a card from the cart when its trash button is pressed", () => {
    const [a] = PHOTOCARDS;
    useUserStore.getState().toggleCart(a.id);
    render(<CartScreen />);

    // Buttons: back(0), trash(1), checkout(2). Press the trash row.
    const buttons = screen.getAllByRole("button");
    fireEvent.press(buttons[1]);
    expect(useUserStore.getState().user?.cartIds).not.toContain(a.id);
  });
});
