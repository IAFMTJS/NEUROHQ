import { expect, test, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL?.trim() ?? "";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /sign in to your account/i })
  ).toBeVisible();

  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("authenticated smoke navigation", () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests."
  );

  test("opens report, strategy, and growth tabs in a real user flow", async ({
    page,
  }) => {
    await test.step("Sign in and land on dashboard", async () => {
      await login(page);
      await expect(page.getByText("Commander status")).toBeVisible();
    });

    await test.step("Report tabs keep deeplink state", async () => {
      await page.goto("/profile?view=insights&tab=patterns");
      await expect(
        page.getByRole("navigation", { name: /insights tabs/i })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /^Patterns$/ })
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page.locator('section[aria-label="Insights tab: patterns"]')
      ).toBeVisible();

      await page.goto("/profile?view=insights&tab=overview");
      await expect(
        page.getByRole("link", { name: /^Overview$/ })
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page.locator('section[aria-label="Insights tab: overview"]')
      ).toBeVisible();
    });

    await test.step("Strategy deeplink opens requested tab", async () => {
      await page.goto("/strategy?tab=alignment");
      await expect(
        page.getByRole("tablist", { name: /strategie-secties/i })
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /alignment & momentum/i })
      ).toHaveAttribute("aria-selected", "true");
    });

    await test.step("Growth page shows command center", async () => {
      await page.goto("/learning");
      await expect(page.getByText(/Growth command center/i).first()).toBeVisible();
    });
  });
});
