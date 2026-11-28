import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import { PhotocardTile } from "./PhotocardTile";
import { useUserStore } from "@/data/userStore";
import type { Photocard } from "@/data/types";

const CARD: Photocard = {
  id: "pc-test",
  groupId: "newjeans",
  groupName: "NewJeans",
  memberId: "nj-minji",
  memberName: "Minji",
  era: "Get Up",
  title: "Minji Get Up Album",
  type: "Album",
  condition: "Mint",
  price: 12.5,
  intent: "sale",
  available: true,
  damaged: false,
  popularity: 500,
  sellerUsername: "pcfairy",
  imgSeed: 3,
};

describe("PhotocardTile", () => {
  beforeEach(() => {
    useUserStore.getState().loginDemo();
  });

  it("shows member, era, price, and seller", () => {
    renderWithRouter(<PhotocardTile card={CARD} />);
    expect(screen.getByText("Minji")).toBeInTheDocument();
    expect(screen.getByText("Get Up")).toBeInTheDocument();
    expect(screen.getByText("$12.50")).toBeInTheDocument();
    expect(screen.getByText("@pcfairy")).toBeInTheDocument();
  });

  it("toggles the card into the cart via the store", () => {
    renderWithRouter(<PhotocardTile card={CARD} />);
    expect(useUserStore.getState().user?.cartIds).not.toContain("pc-test");
    fireEvent.click(screen.getByLabelText("Add to cart"));
    expect(useUserStore.getState().user?.cartIds).toContain("pc-test");
  });

  it("toggles the card into likes via the store", () => {
    renderWithRouter(<PhotocardTile card={CARD} />);
    fireEvent.click(screen.getByLabelText("Add to likes"));
    expect(useUserStore.getState().user?.likesIds).toContain("pc-test");
  });

  it("marks sold-out cards", () => {
    renderWithRouter(<PhotocardTile card={{ ...CARD, available: false }} />);
    expect(screen.getByText("SOLD OUT")).toBeInTheDocument();
  });
});
