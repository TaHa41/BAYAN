import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/?lang=ar", label: "Arabic home" },
  { path: "/?lang=en", label: "English home" },
  { path: "/tools?lang=ar", label: "Arabic tools" },
  { path: "/tools?lang=en", label: "English tools" },
];

for (const route of publicRoutes) {
  test(`loads ${route.label} without an HTTP failure`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response, `${route.path} should return a document response`).not.toBeNull();
    expect(response!.status(), `${route.path} HTTP status`).toBeLessThan(400);
    await expect(page).toHaveTitle(/BAYAN|بيان/i);
    await expect(page.locator("body")).toBeVisible();
  });
}


test("navigation drawer closes with its close button and Escape", async ({ page }) => {
  await page.goto("/?lang=ar", { waitUntil: "domcontentloaded" });
  const drawer = page.locator("#drawer");
  await page.locator("#menu").click();
  await expect(drawer).toHaveClass(/open/);
  await page.locator("#closeDrawer").click();
  await expect(drawer).not.toHaveClass(/open/);
  await expect(page.locator("body")).not.toHaveClass(/drawer-open/);
  await page.locator("#menu").click();
  await expect(drawer).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(drawer).not.toHaveClass(/open/);
});
