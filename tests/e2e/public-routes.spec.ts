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
