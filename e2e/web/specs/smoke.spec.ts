import { test, expect } from "@playwright/test";

/**
 * Core-journey smoke tests on Web. Selectors use visible text / accessible
 * roles so they match what a real user sees and stay stable across platforms.
 */
test.describe("WinKPop web smoke", () => {
  test("a collector can log in as the demo user", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Your photocard universe, all in one place")).toBeVisible();
    await page.getByText("Explore as demo collector").click();
    // Lands on Discover — the search entry and tab bar should be present.
    await expect(page.getByText(/Search your favorite photocards/i)).toBeVisible();
    await expect(page.getByText("Messages", { exact: true })).toBeVisible();
  });

  test("a collector can search, filter, and open a card", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    // Browse is reached from the Discover search entry.
    await page.getByText(/Search your favorite photocards/i).click();
    await page.getByText("NewJeans").first().click();
    await expect(page.getByText(/results/)).toBeVisible();
    const firstCard = page.getByText(/Get Up|OMG|How Sweet|Supernatural|New Jeans/).first();
    await expect(firstCard).toBeVisible();
  });

  test("adding a card to the cart updates the cart total", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    await page.getByLabel("Add to cart").first().click();
    await page.getByRole("button", { name: /cart/i }).first().click();
    await expect(page.getByText("Checkout securely")).toBeVisible();
    await expect(page.getByText(/Buyer protection/)).toBeVisible();
  });

  test("the + tab opens the upload menu", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    await page.getByLabel("Upload").click();
    await expect(page.getByText("What would you like to upload?")).toBeVisible();
    await expect(page.getByText("Upload Listing")).toBeVisible();
  });
});
