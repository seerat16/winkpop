import { test, expect } from "@playwright/test";

/** Core-journey smoke test: log in → browse/filter → add to cart → checkout. */
test.describe("WinKPop smoke", () => {
  test("a collector can log in as the demo user", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Win the K-pop photocard experience")).toBeVisible();
    await page.getByRole("button", { name: "Explore as demo collector" }).click();
    await expect(page.getByText(/Search your favorite photocards/i)).toBeVisible();
  });

  test("a collector can filter by group on Browse", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Explore as demo collector" }).click();
    await page.getByRole("link", { name: "Browse" }).click();
    await page.getByRole("button", { name: "NewJeans" }).click();
    await expect(page.getByText(/results/)).toBeVisible();
  });

  test("adding a card to the cart reaches secure checkout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Explore as demo collector" }).click();
    await page.getByLabel("Add to cart").first().click();
    await page.getByRole("button", { name: "Cart", exact: true }).click();
    await expect(page.getByRole("button", { name: "Checkout securely" })).toBeVisible();
    await expect(page.getByText(/Buyer protection/)).toBeVisible();
  });
});
