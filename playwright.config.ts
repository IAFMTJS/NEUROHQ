import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  reporter: "line",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "off",
  },
  projects: [
    {
      name: "iphone-12",
      use: {
        ...devices["iPhone 12"],
      },
    },
  ],
});

