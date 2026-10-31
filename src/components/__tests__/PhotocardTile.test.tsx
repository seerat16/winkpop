import { render, screen, fireEvent } from "@testing-library/react-native";
import { PhotocardTile } from "../PhotocardTile";
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
    // Fresh demo user before each test so like/cart state is clean.
    useUserStore.setState({ user: null, hydrated: true });
    useUserStore.getState().loginDemo();
  });

  it("shows the member, era, price, and seller", () => {
    render(<PhotocardTile card={CARD} />);
    expect(screen.getByText("Minji")).toBeTruthy();
    expect(screen.getByText("Get Up")).toBeTruthy();
    expect(screen.getByText("$12.50")).toBeTruthy();
    expect(screen.getByText("@pcfairy")).toBeTruthy();
  });

  it("navigates to the card detail when pressed", () => {
    render(<PhotocardTile card={CARD} />);
    // The whole tile (first button) routes to the detail screen.
    fireEvent.press(screen.getAllByRole("button")[0]);
    expect(global.__expoRouterMock.push).toHaveBeenCalledWith("/card/pc-test");
  });

  it("toggles the card into the cart via the store", () => {
    render(<PhotocardTile card={CARD} />);
    expect(useUserStore.getState().user?.cartIds).not.toContain("pc-test");
    fireEvent.press(screen.getByLabelText("Add to cart"));
    expect(useUserStore.getState().user?.cartIds).toContain("pc-test");
  });

  it("toggles the card into likes via the store", () => {
    render(<PhotocardTile card={CARD} />);
    fireEvent.press(screen.getByLabelText("Add to likes"));
    expect(useUserStore.getState().user?.likesIds).toContain("pc-test");
  });

  it("marks sold-out cards", () => {
    render(<PhotocardTile card={{ ...CARD, available: false }} />);
    expect(screen.getByText("SOLD OUT")).toBeTruthy();
  });
});
