import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import CartScreen from "./CartScreen";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { PHOTOCARDS } from "@/data/photocards";

describe("CartScreen", () => {
  beforeEach(() => {
    useUserStore.getState().loginDemo();
    useAppStore.getState().reset();
  });

  it("shows the empty state", () => {
    renderWithRouter(<CartScreen />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("shows subtotal, 5% buyer protection and total", () => {
    const a = PHOTOCARDS[0];
    useUserStore.getState().addToCart([a.id]);
    renderWithRouter(<CartScreen />);
    const fee = Math.round(a.price * 5) / 100;
    expect(screen.getByText("Subtotal (1 card)")).toBeInTheDocument();
    expect(screen.getAllByText(`$${fee.toFixed(2)}`).length).toBeGreaterThan(0);
    expect(screen.getByText(/auto-removed after 30 days/)).toBeInTheDocument();
  });

  it("removes a card", () => {
    const a = PHOTOCARDS[0];
    useUserStore.getState().addToCart([a.id]);
    renderWithRouter(<CartScreen />);
    fireEvent.click(screen.getByLabelText(`Remove ${a.title} from cart`));
    expect(useUserStore.getState().user?.cartIds).not.toContain(a.id);
  });

  it("purchases in demo mode and confirms", async () => {
    const a = PHOTOCARDS[0];
    useUserStore.getState().addToCart([a.id]);
    renderWithRouter(<CartScreen />);
    fireEvent.click(screen.getByText("Checkout securely"));
    expect(await screen.findByText("Purchase Successful!")).toBeInTheDocument();
  });

  it("asks you to select something first", async () => {
    useUserStore.getState().addToCart([PHOTOCARDS[0].id]);
    renderWithRouter(<CartScreen />);
    fireEvent.click(screen.getByLabelText("Deselect all"));
    fireEvent.click(screen.getByText("Checkout securely"));
    expect(await screen.findByText(/Select at least one card/)).toBeInTheDocument();
  });
});
