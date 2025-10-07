import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  globalSetup: "./tests/global-setup.ts",
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [[process.env.CI ? "blob" : "html"], ["junit", { outputFile: "test-results/junit-results.xml" }], ["list"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  timeout: 40000,
  use: {
    baseURL: process.env.CI_ENVIRONMENT_URL || "http://localhost:4200",
    // baseURL: "https://admin.avalanche.report/dev/",

    timezoneId: "Europe/Vienna",

    // Capture screenshot after each test failure.
    screenshot: "only-on-failure",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },

    { name: "firefox", use: { ...devices["Desktop Firefox"] } },

    { name: "webkit", use: { ...devices["Desktop Safari"] } },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: "test-results/",

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI_ENVIRONMENT_URL
    ? undefined
    : { command: "yarn dev", reuseExistingServer: !process.env.CI, timeout: 60 * 1000, url: "http://localhost:4200/" },
});
