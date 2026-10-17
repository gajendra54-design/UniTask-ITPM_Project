import { test, expect } from "@playwright/test";

const TEST_EMAIL = "it23701496@my.sliit.lk";
const TEST_PASSWORD = "sewwandi7";

// ============================================================
// LOGIN HELPER
// Logs in, waits for dashboard to fully settle, then navigates
// ============================================================
async function loginAndGo(page, path) {
  // 1. Go to login page
  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // 2. Fill credentials
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();

  // 3. Wait for dashboard URL to appear
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  // 4. Wait for dashboard to fully finish loading (stops all redirects)
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);

  // 5. Now safely navigate to the target page
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

// ============================================================
// ASSIGNMENTS LIST PAGE  (/assignments)
// ============================================================

test("Assignments page loads with correct heading", async ({ page }) => {
  await loginAndGo(page, "/assignments");

  // exact: true prevents matching "My Assignments" sidebar heading
  await expect(
    page.locator("h1", { hasText: "Assignments" }).last(),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Assignments page loaded with heading");
});

test("Search bar is visible on Assignments page", async ({ page }) => {
  await loginAndGo(page, "/assignments");

  await expect(
    page.getByPlaceholder("Search assignments and calendar tasks..."),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Search bar is visible");
});

test("Status filter dropdown is visible and has correct options", async ({
  page,
}) => {
  await loginAndGo(page, "/assignments");

  const dropdown = page.locator("select");
  await expect(dropdown).toBeVisible({ timeout: 10000 });

  await expect(dropdown).toContainText("All Statuses");
  await expect(dropdown).toContainText("In Progress");
  await expect(dropdown).toContainText("Completed");
  await expect(dropdown).toContainText("Overdue");
  await expect(dropdown).toContainText("Archived");

  console.log("✅ Filter dropdown has all status options");
});

test('"Add Assignment" button is visible', async ({ page }) => {
  await loginAndGo(page, "/assignments");

  await expect(
    page.getByRole("button", { name: /add assignment/i }),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Add Assignment button is visible");
});

test('Clicking "Add Assignment" opens the modal dialog', async ({ page }) => {
  await loginAndGo(page, "/assignments");

  await page.getByRole("button", { name: /add assignment/i }).click();

  await expect(
    page.getByRole("heading", { name: "New Assignment" }),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Add Assignment modal opened successfully");
});

test("Modal contains the instructions textarea", async ({ page }) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  await expect(
    page.getByPlaceholder(
      "Paste your assignment instructions here OR drop a PDF file...",
    ),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Modal textarea is visible");
});

test("Modal contains work hours per day preset buttons", async ({ page }) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  await expect(page.getByRole("button", { name: "1.5h Light" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: "3h Normal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "5h Focused" })).toBeVisible();
  await expect(page.getByRole("button", { name: "8h Intense" })).toBeVisible();

  console.log("✅ Work hours preset buttons are visible");
});

test("Clicking a work hours preset button updates the selection", async ({
  page,
}) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  await page.getByRole("button", { name: "5h Focused" }).click();

  await expect(page.getByText("5h / day")).toBeVisible({ timeout: 10000 });

  console.log("✅ Work hours selection updates correctly");
});

test("User can type into the instructions textarea", async ({ page }) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  const textarea = page.getByPlaceholder(
    "Paste your assignment instructions here OR drop a PDF file...",
  );
  await textarea.fill(
    "Build a REST API with Node.js and Express for a student portal.",
  );

  await expect(textarea).toHaveValue(
    "Build a REST API with Node.js and Express for a student portal.",
  );

  console.log("✅ Textarea accepts user input");
});

test('"Generate AI Breakdown" button is disabled when textarea is empty', async ({
  page,
}) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  await expect(
    page.getByRole("button", { name: /generate ai breakdown/i }),
  ).toBeDisabled({ timeout: 10000 });

  console.log("✅ Analyze button is correctly disabled when no input given");
});

test('"Generate AI Breakdown" button becomes enabled after typing', async ({
  page,
}) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  const textarea = page.getByPlaceholder(
    "Paste your assignment instructions here OR drop a PDF file...",
  );
  await textarea.fill("Create a web app for managing student assignments.");

  await expect(
    page.getByRole("button", { name: /generate ai breakdown/i }),
  ).toBeEnabled({ timeout: 10000 });

  console.log("✅ Analyze button becomes enabled when text is provided");
});

test("Closing the modal with Cancel hides it", async ({ page }) => {
  await loginAndGo(page, "/assignments");
  await page.getByRole("button", { name: /add assignment/i }).click();

  await expect(
    page.getByRole("heading", { name: "New Assignment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).click();
  await expect(
    page.getByRole("heading", { name: "New Assignment" }),
  ).not.toBeVisible();

  console.log("✅ Modal closes correctly when Cancel is clicked");
});

test("Search filters out assignments that do not match", async ({ page }) => {
  await loginAndGo(page, "/assignments");

  const searchBar = page.getByPlaceholder(
    "Search assignments and calendar tasks...",
  );
  await searchBar.fill("xyznotmatchinganything99999");

  // Wait for filtering to apply
  await page.waitForTimeout(500);

  // Check that the assignment grid is now empty (no cards visible)
  const cards = page.locator(".group.relative.overflow-hidden.border");
  const cardCount = await cards.count();
  expect(cardCount).toBe(0);

  console.log("✅ Search correctly filters assignments");
});

test("Selecting a status from the filter dropdown works", async ({ page }) => {
  await loginAndGo(page, "/assignments");

  const dropdown = page.locator("select");
  await dropdown.selectOption("Completed");
  await expect(dropdown).toHaveValue("Completed");

  console.log("✅ Status filter dropdown works correctly");
});

// ============================================================
// ASSIGNMENT DETAILS PAGE  (/assignments/:id)
// ============================================================

test("Assignment Details shows error for an invalid ID", async ({ page }) => {
  await loginAndGo(page, "/assignments/000000000000000000000000");

  await expect(page.getByText("Assignment unavailable")).toBeVisible({
    timeout: 10000,
  });

  console.log("✅ Assignment Details shows correct error for invalid ID");
});

test('"Back to Assignments" button exists on error page', async ({ page }) => {
  await loginAndGo(page, "/assignments/000000000000000000000000");

  await expect(
    page.getByRole("button", { name: /back to assignments/i }),
  ).toBeVisible({ timeout: 10000 });

  console.log("✅ Back to Assignments button is visible on error page");
});

test('"Back to Assignments" button navigates back to list', async ({
  page,
}) => {
  await loginAndGo(page, "/assignments/000000000000000000000000");

  await page.getByRole("button", { name: /back to assignments/i }).click();

  await expect(page).toHaveURL(/\/assignments$/, { timeout: 10000 });

  console.log("✅ Back button navigates to Assignments list");
});

test("Assignment Details shows loading spinner initially", async ({ page }) => {
  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);

  // Slow down the API so the spinner stays visible
  await page.route("**/assignments/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto("/assignments/507f1f77bcf86cd799439011", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByText("Loading assignment data...")).toBeVisible({
    timeout: 10000,
  });

  console.log("✅ Loading spinner appears while assignment data is fetching");
});
