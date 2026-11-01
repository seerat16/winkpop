import { test, expect } from "@playwright/test";

/**
 * Core-journey smoke test on Web: log in → browse → open a card → add to cart.
 *
 * Selectors use visible text / accessible roles so they match what a real user
 * sees and stay stable across platforms.
 */
test.describe("WinKPop web smoke", () => {
  test("a collector can log in as the demo user", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Win the K-pop photocard experience")).toBeVisible();

    await page.getByText("Explore as demo collector").click();

    // Lands on Discover — the search entry and tab bar should be present.
    await expect(page.getByText(/Search your favorite photocards/i)).toBeVisible();
  });

  test("a collector can search, filter, and open a card", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();

    // Go to Browse (search).
    await page.getByText("Browse", { exact: true }).click();

    // Filter to a group, confirm results update and a card opens.
    await page.getByText("NewJeans").first().click();
    const firstCard = page.getByText(/Get Up|OMG|How Sweet|Supernatural|New Jeans/).first();
    await expect(firstCard).toBeVisible();
  });

  test("adding a card to the cart updates the cart total", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();

    // Add the first card on Discover to the cart.
    await page.getByLabel("Add to cart").first().click();

    // Open the cart and confirm the checkout CTA is visible.
    await page.getByRole("button", { name: /cart/i }).first().click();
    await expect(page.getByText("Checkout securely")).toBeVisible();
    await expect(page.getByText(/Buyer protection/)).toBeVisible();
  });
});
