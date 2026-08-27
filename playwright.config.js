const { defineConfig } = require("playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--use-angle=swiftshader", "--disable-gpu-sandbox", "--disable-background-networking"]
    }
  }
});
