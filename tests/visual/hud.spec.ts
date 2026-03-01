import path from "node:path";
import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const OUTPUT_DIR = path.join(process.cwd(), "tests", "visual", "actual");

test("capture HUD screenshots for visual diff", async ({ page }) => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  await page.goto("/test");
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "hud-full.png"),
    fullPage: true,
  });

  await expect(page.getByTestId("ring-region")).toBeVisible();
  await expect(page.getByTestId("graph-region")).toBeVisible();
  await expect(page.getByTestId("primary-button-region")).toBeVisible();

  await page.getByTestId("ring-region").screenshot({
    path: path.join(OUTPUT_DIR, "ring-region.png"),
  });
  await page.getByTestId("graph-region").screenshot({
    path: path.join(OUTPUT_DIR, "graph-region.png"),
  });
  await page.getByTestId("primary-button-region").screenshot({
    path: path.join(OUTPUT_DIR, "button-region.png"),
  });
});

