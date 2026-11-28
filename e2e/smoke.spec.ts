import { test, expect } from "@playwright/test";

/** Core-journey smoke tests: log in → browse/filter → cart → checkout, plus the upload menu. */
test.describe("WinKPop smoke", () => {
  test("a collector can log in as the demo user", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Your photocard universe, all in one place")).toBeVisible();
    await page.getByText("Explore as demo collector").click();
    await expect(page.getByText(/Search your favorite photocards/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Messages" })).toBeVisible();
  });

  test("a collector can filter by group on Browse", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    await page.getByText(/Search your favorite photocards/i).click();
    await page.getByRole("button", { name: "NewJeans" }).first().click();
    await expect(page.getByText(/results/)).toBeVisible();
  });

  test("adding a card to the cart reaches secure checkout", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    await page.getByLabel("Add to cart").first().click();
    await page.getByRole("button", { name: "Cart", exact: true }).click();
    await expect(page.getByRole("button", { name: "Checkout securely" })).toBeVisible();
    await expect(page.getByText(/Buyer protection/)).toBeVisible();
    await page.getByRole("button", { name: "Checkout securely" }).click();
    await expect(page.getByText("Purchase Successful!")).toBeVisible();
  });

  test("the + tab opens the upload menu", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore as demo collector").click();
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByText("What would you like to upload?")).toBeVisible();
    await page.getByText("Upload Listing").click();
    await expect(page.getByText("Publish Listing")).toBeVisible();
  });
});
