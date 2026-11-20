import { render, screen, fireEvent } from "@testing-library/react-native";
import CartScreen from "../cart";
import { useUserStore } from "@/data/userStore";
import { useAppStore } from "@/data/appStore";
import { PHOTOCARDS } from "@/data/photocards";

/** Two cards from different sellers so no bundle discount applies. */
function twoSellers() {
  const a = PHOTOCARDS[0];
  const b = PHOTOCARDS.find((c) => c.sellerUsername !== a.sellerUsername)!;
  return [a, b];
}

describe("CartScreen", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, hydrated: true });
    useUserStore.getState().loginDemo();
    useAppStore.getState().reset();
  });

  it("shows the empty state when the cart has no cards", () => {
    render(<CartScreen />);
    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    expect(screen.getByText("Browse Cards")).toBeTruthy();
  });

  it("lists cards and computes subtotal + 5% buyer protection + total", () => {
    const [a, b] = twoSellers();
    useUserStore.getState().addToCart([a.id, b.id]);
    render(<CartScreen />);

    const subtotal = Math.round((a.price + b.price) * 100) / 100;
    const fee = Math.round(subtotal * 5) / 100;
    const total = Math.round((subtotal + fee) * 100) / 100;

    expect(screen.getByText("Subtotal (2 cards)")).toBeTruthy();
    expect(screen.getAllByText(`$${fee.toFixed(2)}`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`$${total.toFixed(2)}`).length).toBeGreaterThan(0);
    expect(screen.getByText("Checkout securely")).toBeTruthy();
    expect(screen.getByText(/auto-removed after 30 days/)).toBeTruthy();
  });

  it("removes a card from the cart when its trash button is pressed", () => {
    const [a] = PHOTOCARDS;
    useUserStore.getState().toggleCart(a.id);
    render(<CartScreen />);
    fireEvent.press(screen.getByLabelText(`Remove ${a.title} from cart`));
    expect(useUserStore.getState().user?.cartIds).not.toContain(a.id);
  });

  it("purchases the selected cards and shows a confirmation", () => {
    const [a] = PHOTOCARDS;
    useUserStore.getState().toggleCart(a.id);
    render(<CartScreen />);
    fireEvent.press(screen.getByText("Checkout securely"));
    expect(screen.getByText("Purchase Successful!")).toBeTruthy();
    expect(useAppStore.getState().orders.some((o) => o.cardIds.includes(a.id))).toBe(true);
  });

  it("shows an error when nothing is selected", () => {
    const [a] = PHOTOCARDS;
    useUserStore.getState().toggleCart(a.id);
    render(<CartScreen />);
    fireEvent.press(screen.getByLabelText("Deselect all"));
    fireEvent.press(screen.getByText("Checkout securely"));
    expect(screen.getByText(/Select at least one card/)).toBeTruthy();
  });
});
