import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Look for tests inside PW-LiveCurrencyChanger/tests
  testDir: "./tests",

  // Allow up to 5 minutes per test so the 2-minute continuous audit + video/trace saving never times out
  timeout: 300000,

  // Run tests sequentially in 1 worker so logs and rate checks stay ordered
  workers: 1,

  // Print live progress in the terminal AND generate + auto-open a fresh HTML report inside PW-LiveCurrencyChanger/playwright-report
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "always" }],
  ],

  use: {
    // Capture screenshots, full video, and step-by-step traces for every test in the HTML report
    screenshot: "on",
    video: "on",
    trace: "on",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
