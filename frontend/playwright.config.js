import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,

  reporter: [["html", { open: "never" }]], // 👈 ADD THIS

  use: {
    baseURL: "http://localhost:5173",
    headless: false,
    screenshot: "on",
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
