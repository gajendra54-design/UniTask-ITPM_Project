import { test, expect } from "@playwright/test";

const AUTH_STATE = {
  token: "playwright-test-token",
  user: {
    name: "Playwright User",
    email: "playwright@example.com",
  },
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
};

const ASSIGNMENTS = [
  {
    _id: "assignment-1",
    title: "Distributed Systems Report",
    course: "SE4010",
    deadline: "2099-05-20T00:00:00.000Z",
    status: "In Progress",
    subtaskCount: 3,
    completed: 1,
  },
  {
    _id: "assignment-2",
    title: "Networks Presentation",
    course: "SE4020",
    deadline: "2099-05-25T00:00:00.000Z",
    status: "Completed",
    subtaskCount: 2,
    completed: 2,
  },
  {
    _id: "assignment-3",
    title: "Legacy Migration Plan",
    course: "SE4030",
    deadline: "2099-05-28T00:00:00.000Z",
    status: "Archived",
    subtaskCount: 4,
    completed: 4,
  },
];

const CALENDAR_TASKS = [
  {
    _id: "calendar-1",
    title: "Database Lab Review",
    subjectModule: "IT2040",
    type: "lab",
    status: "Pending",
    date: "2099-05-18T00:00:00.000Z",
    startTime: "09:00",
    estimatedHours: 2,
  },
];

const DETAIL_ASSIGNMENT = {
  _id: "assignment-1",
  title: "Distributed Systems Report",
  course: "SE4010",
  aiDescription:
    "Build the report in sequence so each milestone unlocks the next deliverable.",
  deadline: "2099-05-20T00:00:00.000Z",
  totalEstimatedHours: 12,
  realisticDays: 4,
  status: "In Progress",
};

const DETAIL_SUBTASKS = [
  {
    _id: "subtask-1",
    title: "Research journal sources",
    subDescription: "Collect at least five recent journal references.",
    estimatedHours: 3,
    difficultyLevel: "Medium",
    completed: false,
  },
  {
    _id: "subtask-2",
    title: "Draft the system design section",
    subDescription: "Turn the research into architecture diagrams and notes.",
    estimatedHours: 4,
    difficultyLevel: "Hard",
    completed: false,
  },
];

async function seedAuthenticatedSession(page) {
  await page.addInitScript((authState) => {
    window.localStorage.setItem("auth", JSON.stringify(authState));
  }, AUTH_STATE);
}

async function stubSharedApis(page) {
  await page.route(/\/api\/notifications(?:\/.*)?(?:\?.*)?$/, async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname.endsWith("/unread-count")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

async function stubAssignmentsPageApis(
  page,
  { assignments = ASSIGNMENTS, calendarTasks = CALENDAR_TASKS } = {},
) {
  await page.route(/\/api\/assignments$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(assignments),
    });
  });

  await page.route(/\/api\/calendar$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(calendarTasks),
    });
  });
}

async function stubAssignmentDetailsApi(
  page,
  {
    id = DETAIL_ASSIGNMENT._id,
    assignment = DETAIL_ASSIGNMENT,
    subtasks = DETAIL_SUBTASKS,
    delayMs = 0,
    status = 200,
  } = {},
) {
  const assignmentPattern = new RegExp(`/api/assignments/${id}$`);

  await page.route(assignmentPattern, async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        assignment,
        subtasks,
      }),
    });
  });
}

async function stubSubtaskUpdate(page) {
  await page.route(/\/api\/subtasks\/[^/]+$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedSession(page);
  await stubSharedApis(page);
});

test.describe("Assignments page", () => {
  test("renders assignments and supports search, status filtering, and reset", async ({
    page,
  }) => {
    await stubAssignmentsPageApis(page);

    await page.goto("/assignments");

    await expect(
      page.getByRole("heading", { name: "Assignments", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Distributed Systems Report")).toBeVisible();
    await expect(page.getByText("Networks Presentation")).toBeVisible();
    await expect(page.getByText("Calendar Tasks")).toBeVisible();
    await expect(page.getByText("Database Lab Review")).toBeVisible();

    const searchInput = page.getByPlaceholder(
      "Search assignments and calendar tasks...",
    );
    await searchInput.fill("no-match-value");

    await expect(
      page.getByText("No assignments match your filters."),
    ).toBeVisible();
    await expect(
      page.getByText("No calendar tasks match your search."),
    ).toBeVisible();

    await page.getByTitle("Reset Filters").click();

    const statusFilter = page.getByRole("combobox");
    await statusFilter.selectOption("Completed");
    await expect(page.getByText("Networks Presentation")).toBeVisible();

    await page.getByTitle("Reset Filters").click();

    await expect(searchInput).toHaveValue("");
    await expect(statusFilter).toHaveValue("All");
    await expect(page.getByText("Distributed Systems Report")).toBeVisible();
  });

  test("opens the add assignment modal and updates the breakdown inputs", async ({
    page,
  }) => {
    await stubAssignmentsPageApis(page);

    await page.goto("/assignments");

    await page.getByRole("button", { name: "Add Assignment" }).click();

    await expect(
      page.getByRole("heading", { name: "New Assignment" }),
    ).toBeVisible();

    const instructions = page.getByPlaceholder(
      "Paste your assignment instructions here OR drop a PDF file...",
    );
    const generateButton = page.getByRole("button", {
      name: "Generate AI Breakdown",
    });

    await expect(generateButton).toBeDisabled();

    await instructions.fill(
      "Create a software architecture report with milestones and references.",
    );
    await expect(generateButton).toBeEnabled();

    await page.getByRole("button", { name: /^5h\b/i }).click();
    await expect(page.getByText("5h / day")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "New Assignment" }),
    ).toHaveCount(0);
  });

  test("navigates from an assignment card to the details page", async ({
    page,
  }) => {
    await stubAssignmentsPageApis(page);
    await stubAssignmentDetailsApi(page);

    await page.goto("/assignments");
    await page.getByText("Distributed Systems Report").click();

    await expect(page).toHaveURL(/\/assignments\/assignment-1$/);
    await expect(
      page.getByRole("heading", { name: "Distributed Systems Report" }),
    ).toBeVisible();
  });
});

test.describe("Assignment details page", () => {
  test("shows a loading state before rendering the roadmap", async ({
    page,
  }) => {
    await stubAssignmentDetailsApi(page, { delayMs: 700 });

    await page.goto("/assignments/assignment-1");

    await expect(page.getByText("Loading assignment data...")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Distributed Systems Report" }),
    ).toBeVisible();
    await expect(page.getByText("Visual Roadmap")).toBeVisible();
  });

  test("shows the unavailable state for a missing assignment and returns to the list", async ({
    page,
  }) => {
    await stubAssignmentsPageApis(page);
    await stubAssignmentDetailsApi(page, {
      id: "000000000000000000000000",
      assignment: null,
      subtasks: [],
      status: 404,
    });

    await page.goto("/assignments/000000000000000000000000");

    await expect(page.getByText("Assignment unavailable")).toBeVisible();

    await page.getByRole("button", { name: "Back to Assignments" }).click();

    await expect(page).toHaveURL(/\/assignments$/);
    await expect(
      page.getByRole("heading", { name: "Assignments", exact: true }),
    ).toBeVisible();
  });

  test("supports roadmap notes, milestone completion, and edit navigation", async ({
    page,
  }) => {
    await stubAssignmentDetailsApi(page);
    await stubSubtaskUpdate(page);

    await page.goto("/assignments/assignment-1");

    await expect(page.getByText("Roadmap Notes")).toBeVisible();
    await expect(page.getByText("Status Snapshot")).toBeVisible();
    await expect(page.getByText("You Are Here")).toBeVisible();
    await expect(page.locator("button", { hasText: "Locked" })).toBeVisible();

    await page.getByRole("button", { name: "Show Notes" }).first().click();
    await expect(
      page.getByText("Collect at least five recent journal references."),
    ).toBeVisible();

    await page.locator("button", { hasText: "Mark Complete" }).click();

    await expect(
      page.locator("button", { hasText: "Completed" }),
    ).toBeVisible();
    await expect(page.getByText("1 / 2")).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Mark Complete" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit Assignment" }).click();

    await expect(page).toHaveURL(/\/assignments\/edit\/assignment-1$/);
    await expect(page.getByText("Core Details")).toBeVisible();
    await expect(
      page.locator('input[value="Distributed Systems Report"]'),
    ).toBeVisible();
  });
});
